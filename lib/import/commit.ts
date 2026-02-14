'use client';

import { createExercise, findExerciseByName } from '@/lib/data/exercises';
import { createProgramBlock, createProgressionRow, listProgramBlocks } from '@/lib/data/programs';
import type { ValidatedProgressionRow } from '@/lib/import/csv';

export async function commitProgressionImport(input: {
  userId: string;
  rows: ValidatedProgressionRow[];
  createMissingExercises: boolean;
}): Promise<{ createdBlocks: number; createdRows: number; createdExercises: number }> {
  const blockByName = new Map<string, string>();
  const existingBlocks = await listProgramBlocks(input.userId);
  existingBlocks.forEach((item) => {
    blockByName.set(item.name.trim().toLowerCase(), item.id);
  });

  let createdRows = 0;
  let createdBlocks = 0;
  let createdExercises = 0;

  for (const row of input.rows) {
    const blockNameKey = row.data.program_block_name.toLowerCase();
    let programBlockId = blockByName.get(blockNameKey);

    if (!programBlockId) {
      const block = await createProgramBlock({ userId: input.userId, name: row.data.program_block_name });
      programBlockId = block.id;
      blockByName.set(blockNameKey, block.id);
      createdBlocks += 1;
    }

    let exercise = await findExerciseByName(input.userId, row.data.exercise_name);
    if (!exercise && input.createMissingExercises) {
      exercise = await createExercise({ userId: input.userId, name: row.data.exercise_name });
      createdExercises += 1;
    }

    if (!exercise) {
      continue;
    }

    await createProgressionRow({
      userId: input.userId,
      programBlockId,
      week: Number(row.data.week),
      day: Number(row.data.day),
      exerciseId: exercise.id,
      targetSets: Number(row.data.target_sets),
      targetReps: row.data.target_reps,
      targetLoad: row.data.target_load ? Number(row.data.target_load) : undefined,
      targetRpe: row.data.target_rpe ? Number(row.data.target_rpe) : undefined,
      notes: row.data.notes,
    });
    createdRows += 1;
  }

  return { createdBlocks, createdRows, createdExercises };
}
