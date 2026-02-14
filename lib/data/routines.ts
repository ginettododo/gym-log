'use client';

import { db } from '@/lib/offline/db';
import { enqueueMutation } from '@/lib/offline/sync';
import { createClient } from '@/lib/supabase/browser';
import type { Routine, RoutineExercise } from '@/lib/types';

function routineToRow(item: Routine) {
  return {
    id: item.id,
    user_id: item.userId,
    name: item.name,
    created_at: item.createdAt,
    client_updated_at: item.clientUpdatedAt,
  };
}

function rowToRoutine(row: {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  client_updated_at: string;
}): Routine {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    clientUpdatedAt: row.client_updated_at,
  };
}

function routineExerciseToRow(item: RoutineExercise) {
  return {
    id: item.id,
    user_id: item.userId,
    routine_id: item.routineId,
    exercise_id: item.exerciseId,
    sort: item.sort,
    notes: item.notes ?? null,
    created_at: item.createdAt,
    client_updated_at: item.clientUpdatedAt,
  };
}

export async function listRoutines(userId: string): Promise<Routine[]> {
  if (navigator.onLine) {
    const supabase = createClient();
    const { data } = await supabase
      .from('routines')
      .select('id,user_id,name,created_at,client_updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) {
      await db.routines.bulkPut(data.map(rowToRoutine));
    }
  }

  const local = await db.routines.where('userId').equals(userId).reverse().sortBy('createdAt');
  return local.filter((item) => !item.deletedAt);
}

export async function createRoutine(input: { userId: string; name: string }): Promise<Routine> {
  const now = new Date().toISOString();
  const routine: Routine = {
    id: crypto.randomUUID(),
    userId: input.userId,
    name: input.name.trim(),
    createdAt: now,
    clientUpdatedAt: now,
  };

  await db.routines.put(routine);
  await enqueueMutation({
    userId: input.userId,
    tableName: 'routines',
    operation: 'upsert',
    payload: routineToRow(routine),
    idempotencyKey: `routine:${routine.id}:${routine.clientUpdatedAt}`,
  });

  return routine;
}

export async function addExerciseToRoutine(input: {
  userId: string;
  routineId: string;
  exerciseId: string;
}): Promise<RoutineExercise> {
  const now = new Date().toISOString();
  const existing = await db.routineExercises.where('routineId').equals(input.routineId).toArray();
  const routineExercise: RoutineExercise = {
    id: crypto.randomUUID(),
    userId: input.userId,
    routineId: input.routineId,
    exerciseId: input.exerciseId,
    sort: existing.length,
    createdAt: now,
    clientUpdatedAt: now,
  };

  await db.routineExercises.put(routineExercise);
  await enqueueMutation({
    userId: input.userId,
    tableName: 'routine_exercises',
    operation: 'upsert',
    payload: routineExerciseToRow(routineExercise),
    idempotencyKey: `routine_exercise:${routineExercise.id}:${routineExercise.clientUpdatedAt}`,
  });

  return routineExercise;
}

export async function listRoutineExercises(routineId: string): Promise<RoutineExercise[]> {
  const items = await db.routineExercises.where('routineId').equals(routineId).sortBy('sort');
  return items.filter((item) => !item.deletedAt);
}
