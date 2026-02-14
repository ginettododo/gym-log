import { describe, expect, it } from 'vitest';
import { db } from '@/lib/offline/db';
import { commitProgressionImport } from '@/lib/import/commit';

describe('commit import offline-first', () => {
  it('scrive blocchi, esercizi, righe e coda sync in locale', async () => {
    const userId = '00000000-0000-0000-0000-000000000001';

    const result = await commitProgressionImport({
      userId,
      createMissingExercises: true,
      rows: [
        {
          rowNumber: 2,
          data: {
            program_block_name: 'Forza Base',
            week: '1',
            day: '1',
            exercise_name: 'Panca Piana',
            target_sets: '5',
            target_reps: '5',
            target_load: '80',
            target_rpe: '8',
            notes: 'Test',
          },
        },
      ],
    });

    expect(result.createdBlocks).toBe(1);
    expect(result.createdExercises).toBe(1);
    expect(result.createdRows).toBe(1);

    const blocks = await db.programBlocks.toArray();
    const rows = await db.progressionRows.toArray();
    const exercises = await db.exercises.toArray();
    const queue = await db.syncMutations.toArray();

    expect(blocks).toHaveLength(1);
    expect(exercises).toHaveLength(1);
    expect(rows).toHaveLength(1);
    expect(queue.length).toBeGreaterThanOrEqual(3);
  });
});
