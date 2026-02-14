'use client';

import { db } from '@/lib/offline/db';
import { enqueueMutation } from '@/lib/offline/sync';
import { createClient } from '@/lib/supabase/browser';
import type { Exercise } from '@/lib/types';

function toExerciseRow(exercise: Exercise) {
  return {
    id: exercise.id,
    user_id: exercise.userId,
    name: exercise.name,
    muscle_groups: exercise.muscleGroups,
    equipment: exercise.equipment,
    created_at: exercise.createdAt,
    client_updated_at: exercise.clientUpdatedAt,
  };
}

function fromExerciseRow(row: {
  id: string;
  user_id: string;
  name: string;
  muscle_groups: string[];
  equipment: string;
  created_at: string;
  client_updated_at: string;
}): Exercise {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    muscleGroups: row.muscle_groups,
    equipment: row.equipment,
    createdAt: row.created_at,
    clientUpdatedAt: row.client_updated_at,
  };
}

export async function listExercises(userId: string): Promise<Exercise[]> {
  if (navigator.onLine) {
    const supabase = createClient();
    const { data } = await supabase
      .from('exercises')
      .select('id,user_id,name,muscle_groups,equipment,created_at,client_updated_at')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (data) {
      const mapped = data.map(fromExerciseRow);
      await db.exercises.bulkPut(mapped);
    }
  }

  return db.exercises.where('userId').equals(userId).sortBy('name');
}

export async function createExercise(input: {
  userId: string;
  name: string;
  muscleGroups?: string[];
  equipment?: string;
}): Promise<Exercise> {
  const now = new Date().toISOString();
  const exercise: Exercise = {
    id: crypto.randomUUID(),
    userId: input.userId,
    name: input.name.trim(),
    muscleGroups: input.muscleGroups ?? [],
    equipment: input.equipment ?? '',
    createdAt: now,
    clientUpdatedAt: now,
  };

  await db.exercises.put(exercise);
  await enqueueMutation({
    userId: input.userId,
    tableName: 'exercises',
    operation: 'upsert',
    payload: toExerciseRow(exercise),
    idempotencyKey: `exercise:${exercise.id}:${exercise.clientUpdatedAt}`,
  });

  return exercise;
}

export async function findExerciseByName(userId: string, name: string): Promise<Exercise | undefined> {
  const normalized = name.trim().toLowerCase();
  const items = await listExercises(userId);
  return items.find((item) => item.name.trim().toLowerCase() === normalized);
}
