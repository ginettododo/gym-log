'use client';

import { db } from '@/lib/offline/db';
import { enqueueMutation } from '@/lib/offline/sync';
import { createClient } from '@/lib/supabase/browser';
import type { SetEntryDraft, UserSetting, WorkoutExerciseDraft, WorkoutSessionDraft } from '@/lib/types';

function toSessionRow(item: WorkoutSessionDraft) {
  return {
    id: item.id,
    user_id: item.userId,
    started_at: item.startedAt,
    ended_at: item.endedAt ?? null,
    notes: item.notes,
    client_updated_at: item.clientUpdatedAt,
  };
}

function toWorkoutExerciseRow(item: WorkoutExerciseDraft) {
  return {
    id: item.id,
    user_id: item.userId,
    session_id: item.sessionId,
    exercise_id: item.exerciseId,
    sort: item.sort,
    notes: item.notes,
    client_updated_at: item.clientUpdatedAt,
  };
}

function toSetRow(item: SetEntryDraft) {
  return {
    id: item.id,
    user_id: item.userId,
    workout_exercise_id: item.workoutExerciseId,
    set_type: item.setType,
    weight: item.weight ?? null,
    reps: item.reps ?? null,
    rpe: item.rpe ?? null,
    rir: item.rir ?? null,
    is_completed: item.isCompleted,
    client_updated_at: item.clientUpdatedAt,
  };
}

export async function createWorkoutSessionDraft(input: {
  userId: string;
  routineId?: string;
}): Promise<WorkoutSessionDraft> {
  const now = new Date().toISOString();
  const session: WorkoutSessionDraft = {
    id: crypto.randomUUID(),
    userId: input.userId,
    startedAt: now,
    notes: '',
    routineId: input.routineId,
    status: 'draft',
    updatedAt: now,
    clientUpdatedAt: now,
  };

  await db.workoutSessionDrafts.put(session);
  await enqueueMutation({
    userId: input.userId,
    tableName: 'workout_sessions',
    operation: 'upsert',
    payload: toSessionRow(session),
    idempotencyKey: `workout_session:${session.id}:${session.clientUpdatedAt}`,
  });

  return session;
}

export async function listRecentSessions(userId: string): Promise<WorkoutSessionDraft[]> {
  if (navigator.onLine) {
    const supabase = createClient();
    const { data } = await supabase
      .from('workout_sessions')
      .select('id,user_id,started_at,ended_at,notes,client_updated_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(20);

    if (data) {
      await db.workoutSessionDrafts.bulkPut(
        data.map((row) => ({
          id: row.id,
          userId: row.user_id,
          startedAt: row.started_at,
          endedAt: row.ended_at ?? undefined,
          notes: row.notes ?? '',
          status: row.ended_at ? 'completed' : 'draft',
          updatedAt: row.client_updated_at,
          clientUpdatedAt: row.client_updated_at,
        })),
      );
    }
  }

  return db.workoutSessionDrafts.where('userId').equals(userId).reverse().sortBy('startedAt');
}

export async function getWorkoutSession(sessionId: string): Promise<WorkoutSessionDraft | undefined> {
  return db.workoutSessionDrafts.get(sessionId);
}

export async function upsertSessionNotes(input: { sessionId: string; notes: string }): Promise<void> {
  const existing = await db.workoutSessionDrafts.get(input.sessionId);
  if (!existing) {
    return;
  }

  const now = new Date().toISOString();
  const updated: WorkoutSessionDraft = {
    ...existing,
    notes: input.notes,
    updatedAt: now,
    clientUpdatedAt: now,
  };

  await db.workoutSessionDrafts.put(updated);
  await enqueueMutation({
    userId: updated.userId,
    tableName: 'workout_sessions',
    operation: 'upsert',
    payload: toSessionRow(updated),
    idempotencyKey: `workout_session:${updated.id}:${updated.clientUpdatedAt}`,
  });
}

export async function finishWorkoutSession(sessionId: string): Promise<void> {
  const existing = await db.workoutSessionDrafts.get(sessionId);
  if (!existing) {
    return;
  }
  const now = new Date().toISOString();
  const updated: WorkoutSessionDraft = {
    ...existing,
    endedAt: now,
    status: 'completed',
    updatedAt: now,
    clientUpdatedAt: now,
  };

  await db.workoutSessionDrafts.put(updated);
  await enqueueMutation({
    userId: updated.userId,
    tableName: 'workout_sessions',
    operation: 'upsert',
    payload: toSessionRow(updated),
    idempotencyKey: `workout_session:${updated.id}:${updated.clientUpdatedAt}`,
  });
}

export async function addExerciseToSession(input: {
  userId: string;
  sessionId: string;
  exerciseId: string;
  defaultWeight?: number;
  defaultReps?: number;
  restSeconds?: number;
}): Promise<WorkoutExerciseDraft> {
  const now = new Date().toISOString();
  const current = await db.workoutExerciseDrafts.where('sessionId').equals(input.sessionId).toArray();

  const workoutExercise: WorkoutExerciseDraft = {
    id: crypto.randomUUID(),
    userId: input.userId,
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    sort: current.length,
    notes: '',
    restSeconds: input.restSeconds,
    updatedAt: now,
    clientUpdatedAt: now,
  };

  const initialSet: SetEntryDraft = {
    id: crypto.randomUUID(),
    userId: input.userId,
    workoutExerciseId: workoutExercise.id,
    setType: 'working',
    weight: input.defaultWeight,
    reps: input.defaultReps,
    isCompleted: false,
    createdAt: now,
    clientUpdatedAt: now,
  };

  await db.workoutExerciseDrafts.put(workoutExercise);
  await db.setEntryDrafts.put(initialSet);

  await enqueueMutation({
    userId: input.userId,
    tableName: 'workout_exercises',
    operation: 'upsert',
    payload: toWorkoutExerciseRow(workoutExercise),
    idempotencyKey: `workout_exercise:${workoutExercise.id}:${workoutExercise.clientUpdatedAt}`,
  });

  await enqueueMutation({
    userId: input.userId,
    tableName: 'set_entries',
    operation: 'upsert',
    payload: toSetRow(initialSet),
    idempotencyKey: `set_entry:${initialSet.id}:${initialSet.clientUpdatedAt}`,
  });

  return workoutExercise;
}

export async function listWorkoutExercises(sessionId: string): Promise<WorkoutExerciseDraft[]> {
  return db.workoutExerciseDrafts.where('sessionId').equals(sessionId).sortBy('sort');
}

export async function listSetEntries(workoutExerciseId: string): Promise<SetEntryDraft[]> {
  return db.setEntryDrafts.where('workoutExerciseId').equals(workoutExerciseId).sortBy('createdAt');
}

export async function upsertSetEntry(input: SetEntryDraft): Promise<void> {
  const now = new Date().toISOString();
  const row: SetEntryDraft = {
    ...input,
    clientUpdatedAt: now,
  };
  await db.setEntryDrafts.put(row);
  await enqueueMutation({
    userId: row.userId,
    tableName: 'set_entries',
    operation: 'upsert',
    payload: toSetRow(row),
    idempotencyKey: `set_entry:${row.id}:${row.clientUpdatedAt}`,
  });
}

export async function appendSetFromPrevious(workoutExerciseId: string): Promise<SetEntryDraft | undefined> {
  const sets = await listSetEntries(workoutExerciseId);
  const previous = sets.at(-1);
  if (!previous) {
    return undefined;
  }
  const clone: SetEntryDraft = {
    ...previous,
    id: crypto.randomUUID(),
    isCompleted: false,
    createdAt: new Date().toISOString(),
    clientUpdatedAt: new Date().toISOString(),
  };
  await upsertSetEntry(clone);
  return clone;
}

export async function createEmptySet(input: {
  userId: string;
  workoutExerciseId: string;
}): Promise<SetEntryDraft> {
  const now = new Date().toISOString();
  const set: SetEntryDraft = {
    id: crypto.randomUUID(),
    userId: input.userId,
    workoutExerciseId: input.workoutExerciseId,
    setType: 'working',
    isCompleted: false,
    createdAt: now,
    clientUpdatedAt: now,
  };

  await upsertSetEntry(set);
  return set;
}

export async function undoLastSet(workoutExerciseId: string): Promise<void> {
  const sets = await listSetEntries(workoutExerciseId);
  const last = sets.at(-1);
  if (!last) {
    return;
  }
  await db.setEntryDrafts.delete(last.id);
  await enqueueMutation({
    userId: last.userId,
    tableName: 'set_entries',
    operation: 'delete',
    payload: { id: last.id },
    idempotencyKey: `set_entry:delete:${last.id}:${new Date().toISOString()}`,
  });
}

export async function getUserSetting(userId: string): Promise<UserSetting> {
  const existing = await db.userSettings.get(userId);
  if (existing) {
    return existing;
  }
  const setting: UserSetting = {
    userId,
    defaultRestSeconds: 120,
    updatedAt: new Date().toISOString(),
  };
  await db.userSettings.put(setting);
  return setting;
}

export async function updateUserDefaultRest(userId: string, defaultRestSeconds: number): Promise<void> {
  await db.userSettings.put({
    userId,
    defaultRestSeconds,
    updatedAt: new Date().toISOString(),
  });
}

export async function getSessionVolume(sessionId: string): Promise<number> {
  const exercises = await listWorkoutExercises(sessionId);
  let total = 0;
  for (const exercise of exercises) {
    const sets = await listSetEntries(exercise.id);
    for (const set of sets) {
      if (set.isCompleted && set.weight && set.reps) {
        total += set.weight * set.reps;
      }
    }
  }
  return total;
}
