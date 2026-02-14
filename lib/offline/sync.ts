import { db } from '@/lib/offline/db';
import type { JsonValue, SyncMutation } from '@/lib/types';
import { createClient } from '@/lib/supabase/browser';

const RETRY_BASE_MS = 2000;
const MAX_ATTEMPTS = 8;

function retryTimestamp(attempts: number): string {
  const delay = RETRY_BASE_MS * 2 ** Math.min(attempts, 6);
  return new Date(Date.now() + delay).toISOString();
}

export async function enqueueMutation(input: {
  userId: string;
  tableName: string;
  operation: 'upsert' | 'delete';
  payload: JsonValue;
  idempotencyKey: string;
}): Promise<void> {
  const mutation: SyncMutation = {
    id: crypto.randomUUID(),
    userId: input.userId,
    tableName: input.tableName,
    operation: input.operation,
    payload: input.payload,
    attempts: 0,
    nextAttemptAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    idempotencyKey: input.idempotencyKey,
  };

  await db.syncMutations.put(mutation);
}

export async function flushMutationQueue(userId: string): Promise<number> {
  if (!navigator.onLine) {
    return 0;
  }

  const supabase = createClient();
  const now = new Date().toISOString();
  const readyMutations = await db.syncMutations
    .where('userId')
    .equals(userId)
    .and((item) => item.nextAttemptAt <= now)
    .sortBy('createdAt');

  let flushedCount = 0;

  for (const mutation of readyMutations) {
    try {
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
      }

      if (mutation.operation === 'delete') {
        const payloadRecord = mutation.payload as { id: string };
        const { error } = await supabase
          .from(mutation.tableName)
          .delete()
          .eq('id', payloadRecord.id);

        if (error) {
          throw error;
        }
      }

      flushedCount += 1;
      await db.syncMutations.delete(mutation.id);
    } catch {
      const nextAttempts = mutation.attempts + 1;
      if (nextAttempts >= MAX_ATTEMPTS) {
        await db.syncMutations.delete(mutation.id);
        continue;
      }

      await db.syncMutations.update(mutation.id, {
        attempts: nextAttempts,
        nextAttemptAt: retryTimestamp(nextAttempts),
      });
    }
  }

  return flushedCount;
}
