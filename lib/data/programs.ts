'use client';

import { db } from '@/lib/offline/db';
import { enqueueMutation } from '@/lib/offline/sync';
import { shouldApplyRemoteRecord } from '@/lib/offline/sync-engine';
import { createClient } from '@/lib/supabase/browser';
import type { ProgramBlock, ProgressionActual, ProgressionRow } from '@/lib/types';

function pbToRow(item: ProgramBlock) {
  return {
    id: item.id,
    user_id: item.userId,
    name: item.name,
    created_at: item.createdAt,
    client_updated_at: item.clientUpdatedAt,
    version: item.version,
  };
}

function rowToPb(row: {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  client_updated_at: string;
  version?: number;
}): ProgramBlock {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    clientUpdatedAt: row.client_updated_at,
    version: row.version ?? 1,
  };
}

function prToRow(item: ProgressionRow) {
  return {
    id: item.id,
    user_id: item.userId,
    program_block_id: item.programBlockId,
    week: item.week,
    day: item.day,
    exercise_id: item.exerciseId,
    target_sets: item.targetSets,
    target_reps: item.targetReps,
    target_load: item.targetLoad ?? null,
    target_rpe: item.targetRpe ?? null,
    notes: item.notes ?? null,
    created_at: item.createdAt,
    client_updated_at: item.clientUpdatedAt,
    version: item.version,
  };
}

function rowToPr(row: {
  id: string;
  user_id: string;
  program_block_id: string;
  week: number;
  day: number;
  exercise_id: string;
  target_sets: number;
  target_reps: string;
  target_load: number | null;
  target_rpe: number | null;
  notes: string | null;
  created_at: string;
  client_updated_at: string;
  version?: number;
}): ProgressionRow {
  return {
    id: row.id,
    userId: row.user_id,
    programBlockId: row.program_block_id,
    week: row.week,
    day: row.day,
    exerciseId: row.exercise_id,
    targetSets: row.target_sets,
    targetReps: row.target_reps,
    targetLoad: row.target_load ?? undefined,
    targetRpe: row.target_rpe ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    clientUpdatedAt: row.client_updated_at,
    version: row.version ?? 1,
  };
}

function paToRow(item: ProgressionActual) {
  return {
    id: item.id,
    user_id: item.userId,
    progression_row_id: item.progressionRowId,
    date: item.date,
    actual_weight: item.actualWeight ?? null,
    actual_reps: item.actualReps ?? null,
    actual_rpe: item.actualRpe ?? null,
    notes: item.notes ?? null,
    created_at: item.createdAt,
    client_updated_at: item.clientUpdatedAt,
    version: item.version,
  };
}

export async function listProgramBlocks(userId: string): Promise<ProgramBlock[]> {
  if (navigator.onLine) {
    const supabase = createClient();
    const { data } = await supabase
      .from('program_blocks')
      .select('id,user_id,name,created_at,client_updated_at,version')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      await db.programBlocks.bulkPut(data.map(rowToPb));
    }
  }

  const local = await db.programBlocks.where('userId').equals(userId).reverse().sortBy('createdAt');
  return local.filter((item) => !item.deletedAt);
}

export async function createProgramBlock(input: {
  userId: string;
  name: string;
}): Promise<ProgramBlock> {
  const now = new Date().toISOString();
  const block: ProgramBlock = {
    id: crypto.randomUUID(),
    userId: input.userId,
    name: input.name.trim(),
    createdAt: now,
    clientUpdatedAt: now,
    version: 1,
  };

  await db.programBlocks.put(block);
  await enqueueMutation({
    userId: input.userId,
    tableName: 'program_blocks',
    operation: 'upsert',
    payload: pbToRow(block),
    idempotencyKey: `program_block:${block.id}:${block.clientUpdatedAt}`,
  });

  return block;
}

export async function deleteProgramBlock(input: { userId: string; id: string }): Promise<void> {
  const now = new Date().toISOString();
  const existing = await db.programBlocks.get(input.id);
  await db.programBlocks.update(input.id, {
    deletedAt: now,
    clientUpdatedAt: now,
    version: (existing?.version ?? 0) + 1,
  });
  await enqueueMutation({
    userId: input.userId,
    tableName: 'program_blocks',
    operation: 'delete',
    payload: { id: input.id },
    idempotencyKey: `program_block:delete:${input.id}:${now}`,
  });
}

export async function listProgressionRows(input: {
  userId: string;
  programBlockId: string;
}): Promise<ProgressionRow[]> {
  if (navigator.onLine) {
    const supabase = createClient();
    const [remoteResult, pending] = await Promise.all([
      supabase
        .from('progression_rows')
        .select(
          'id,user_id,program_block_id,week,day,exercise_id,target_sets,target_reps,target_load,target_rpe,notes,created_at,client_updated_at,version',
        )
        .eq('user_id', input.userId)
        .eq('program_block_id', input.programBlockId),
      db.syncMutations
        .where('userId')
        .equals(input.userId)
        .and((m) => m.tableName === 'progression_rows')
        .toArray(),
    ]);

    if (remoteResult.data) {
      const pendingIds = new Set(pending.map((item) => item.recordId));
      for (const row of remoteResult.data) {
        const local = await db.progressionRows.get(row.id);
        if (
          shouldApplyRemoteRecord({
            hasPendingEdits: pendingIds.has(row.id),
            localClientUpdatedAt: local?.clientUpdatedAt,
            remoteClientUpdatedAt: row.client_updated_at,
          })
        ) {
          await db.progressionRows.put(rowToPr(row));
        }
      }
    }
  }

  const rows = await db.progressionRows.where('programBlockId').equals(input.programBlockId).sortBy('week');
  return rows.filter((item) => !item.deletedAt);
}

export async function createProgressionRow(
  input: Omit<ProgressionRow, 'id' | 'createdAt' | 'clientUpdatedAt' | 'deletedAt' | 'version'>,
): Promise<ProgressionRow> {
  const now = new Date().toISOString();
  const row: ProgressionRow = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    clientUpdatedAt: now,
    version: 1,
  };

  await db.progressionRows.put(row);
  await enqueueMutation({
    userId: row.userId,
    tableName: 'progression_rows',
    operation: 'upsert',
    payload: prToRow(row),
    idempotencyKey: `progression_row:${row.id}:${row.clientUpdatedAt}`,
  });

  return row;
}

export async function updateProgressionRow(
  input: Pick<ProgressionRow, 'id' | 'userId'> & Partial<ProgressionRow>,
): Promise<void> {
  const now = new Date().toISOString();
  const existing = await db.progressionRows.get(input.id);
  if (!existing) {
    return;
  }

  const updated: ProgressionRow = {
    ...existing,
    ...input,
    clientUpdatedAt: now,
    version: existing.version + 1,
  };

  await db.progressionRows.put(updated);
  await enqueueMutation({
    userId: input.userId,
    tableName: 'progression_rows',
    operation: 'upsert',
    payload: prToRow(updated),
    idempotencyKey: `progression_row:${updated.id}:${updated.clientUpdatedAt}`,
  });
}

export async function deleteProgressionRow(input: { userId: string; id: string }): Promise<void> {
  const now = new Date().toISOString();
  const existing = await db.progressionRows.get(input.id);
  await db.progressionRows.update(input.id, {
    deletedAt: now,
    clientUpdatedAt: now,
    version: (existing?.version ?? 0) + 1,
  });
  await enqueueMutation({
    userId: input.userId,
    tableName: 'progression_rows',
    operation: 'delete',
    payload: { id: input.id },
    idempotencyKey: `progression_row:delete:${input.id}:${now}`,
  });
}

export async function listProgressionActuals(
  userId: string,
  progressionRowIds: string[],
): Promise<ProgressionActual[]> {
  if (progressionRowIds.length === 0) {
    return [];
  }

  const records = await db.progressionActuals.where('progressionRowId').anyOf(progressionRowIds).toArray();
  return records.filter((item) => item.userId === userId && !item.deletedAt);
}

export async function addProgressionActual(
  input: Omit<ProgressionActual, 'id' | 'createdAt' | 'clientUpdatedAt' | 'deletedAt' | 'version'>,
): Promise<ProgressionActual> {
  const now = new Date().toISOString();
  const actual: ProgressionActual = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    clientUpdatedAt: now,
    version: 1,
  };

  await db.progressionActuals.put(actual);
  await enqueueMutation({
    userId: input.userId,
    tableName: 'progression_actuals',
    operation: 'upsert',
    payload: paToRow(actual),
    idempotencyKey: `progression_actual:${actual.id}:${actual.clientUpdatedAt}`,
  });

  return actual;
}
