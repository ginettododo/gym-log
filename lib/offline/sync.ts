import { db } from '@/lib/offline/db';
import {
  classifySyncError,
  computeBackoffMs,
  mutationStatusForError,
  sortMutationsForFlush,
} from '@/lib/offline/sync-engine';
import type { JsonValue, SyncMutation, SyncMutationStatus } from '@/lib/types';
import { createClient } from '@/lib/supabase/browser';

const MAX_ATTEMPTS = 12;
const MAX_LOG_EVENTS = 200;

function nextRetryTimestamp(attempts: number): string {
  return new Date(Date.now() + computeBackoffMs(attempts)).toISOString();
}

function inferRecordId(payload: JsonValue): string {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return '';
  }
  return typeof payload.id === 'string' ? payload.id : '';
}

export function createIdempotencyKey(): string {
  return crypto.randomUUID();
}

async function addSyncLog(input: {
  userId: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  details?: string;
}): Promise<void> {
  await db.syncLogs.add({
    id: crypto.randomUUID(),
    userId: input.userId,
    createdAt: new Date().toISOString(),
    level: input.level,
    event: input.event,
    details: input.details,
  });

  const events = await db.syncLogs.where('userId').equals(input.userId).sortBy('createdAt');
  if (events.length > MAX_LOG_EVENTS) {
    const toDelete = events.slice(0, events.length - MAX_LOG_EVENTS).map((item) => item.id);
    await db.syncLogs.bulkDelete(toDelete);
  }
}

export async function enqueueMutation(input: {
  userId: string;
  tableName: string;
  operation: 'upsert' | 'delete';
  payload: JsonValue;
  idempotencyKey?: string;
  transactionGroup?: string;
  orderingKey?: number;
  recordId?: string;
}): Promise<void> {
  const mutation: SyncMutation = {
    id: crypto.randomUUID(),
    userId: input.userId,
    tableName: input.tableName,
    operation: input.operation,
    payload: input.payload,
    recordId: input.recordId ?? inferRecordId(input.payload),
    attempts: 0,
    nextAttemptAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    lastAttemptAt: undefined,
    idempotencyKey: input.idempotencyKey ?? createIdempotencyKey(),
    transactionGroup: input.transactionGroup ?? createIdempotencyKey(),
    orderingKey: input.orderingKey ?? 100,
    status: 'queued',
  };

  await db.syncMutations.put(mutation);
}

function describeError(error: unknown): { code?: string; message: string } {
  if (!error || typeof error !== 'object') {
    return { message: 'Errore sconosciuto' };
  }

  const maybe = error as { code?: string; message?: string };
  return { code: maybe.code, message: maybe.message ?? 'Errore sconosciuto' };
}

async function executeMutation(mutation: SyncMutation): Promise<void> {
  const supabase = createClient();
  if (mutation.operation === 'upsert') {
    const payloadRecord = mutation.payload as Record<string, JsonValue>;
    const { error } = await supabase
      .from(mutation.tableName)
      .upsert(payloadRecord, { onConflict: 'id' })
      .select('id')
      .single();

    if (error) {
      throw error;
    }
    return;
  }

  const payloadRecord = mutation.payload as { id: string };
  const { error } = await supabase.from(mutation.tableName).delete().eq('id', payloadRecord.id);
  if (error) {
    throw error;
  }
}

async function markMutationStatus(mutationId: string, status: SyncMutationStatus, extra: Partial<SyncMutation>) {
  await db.syncMutations.update(mutationId, {
    status,
    ...extra,
  });
}

export async function flushMutationQueue(userId: string): Promise<number> {
  if (!navigator.onLine) {
    return 0;
  }

  const now = new Date().toISOString();
  const readyMutations = await db.syncMutations
    .where('userId')
    .equals(userId)
    .and((item) => item.nextAttemptAt <= now && (item.status === 'queued' || item.status === 'failed'))
    .toArray();

  const sorted = sortMutationsForFlush(readyMutations);
  let flushedCount = 0;

  for (const mutation of sorted) {
    try {
      await executeMutation(mutation);
      flushedCount += 1;
      await db.syncMutations.delete(mutation.id);
      await addSyncLog({
        userId,
        level: 'info',
        event: 'mutation_flushed',
        details: `${mutation.tableName}:${mutation.operation}`,
      });
    } catch (error) {
      const errType = classifySyncError(error);
      const details = describeError(error);
      const nextAttempts = mutation.attempts + 1;

      if (errType === 'auth' || errType === 'permission') {
        await markMutationStatus(mutation.id, mutationStatusForError(errType), {
          attempts: nextAttempts,
          lastAttemptAt: new Date().toISOString(),
          lastErrorCode: details.code,
          lastErrorMessage: details.message,
        });
        await addSyncLog({
          userId,
          level: 'warn',
          event: errType === 'auth' ? 'sync_auth_required' : 'sync_permission_denied',
          details: details.message,
        });
        continue;
      }

      if (errType === 'validation' || nextAttempts >= MAX_ATTEMPTS) {
        await markMutationStatus(mutation.id, 'failed', {
          attempts: nextAttempts,
          lastAttemptAt: new Date().toISOString(),
          lastErrorCode: details.code,
          lastErrorMessage: details.message,
          nextAttemptAt: nextRetryTimestamp(nextAttempts),
        });
        await addSyncLog({ userId, level: 'error', event: 'sync_failed', details: details.message });
        continue;
      }

      await markMutationStatus(mutation.id, 'queued', {
        attempts: nextAttempts,
        lastAttemptAt: new Date().toISOString(),
        lastErrorCode: details.code,
        lastErrorMessage: details.message,
        nextAttemptAt: nextRetryTimestamp(nextAttempts),
      });
      await addSyncLog({ userId, level: 'warn', event: 'sync_retry_scheduled', details: details.message });
    }
  }

  if (flushedCount > 0) {
    await db.syncState.put({ userId, lastSyncAt: new Date().toISOString() });
  }

  return flushedCount;
}

export async function getSyncSnapshot(userId: string) {
  const [queued, failed, logs, state] = await Promise.all([
    db.syncMutations.where('userId').equals(userId).and((m) => m.status === 'queued').count(),
    db.syncMutations
      .where('userId')
      .equals(userId)
      .and((m) => m.status === 'failed' || m.status === 'auth_required' || m.status === 'permission_denied')
      .toArray(),
    db.syncLogs.where('userId').equals(userId).reverse().sortBy('createdAt'),
    db.syncState.get(userId),
  ]);

  return {
    queued,
    failed,
    logs: logs.slice(-20).reverse(),
    lastSyncAt: state?.lastSyncAt,
  };
}

export async function retryAllMutations(userId: string): Promise<void> {
  const items = await db.syncMutations.where('userId').equals(userId).toArray();
  await Promise.all(
    items.map((item) =>
      db.syncMutations.update(item.id, {
        status: 'queued',
        nextAttemptAt: new Date().toISOString(),
      }),
    ),
  );
}

export async function exportFailedMutations(userId: string): Promise<string> {
  const items = await db.syncMutations
    .where('userId')
    .equals(userId)
    .and((m) => m.status !== 'queued')
    .toArray();

  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      schema_version: 1,
      failed_mutations: items,
    },
    null,
    2,
  );
}
