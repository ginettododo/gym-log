import { describe, expect, it } from 'vitest';
import { db } from '@/lib/offline/db';
import { createWorkoutSessionDraft } from '@/lib/data/workouts';

describe('workout draft locale', () => {
  it('crea bozza sessione e mette mutazione in coda', async () => {
    const userId = 'u1';
    const session = await createWorkoutSessionDraft({ userId });

    const saved = await db.workoutSessionDrafts.get(session.id);
    const queue = await db.syncMutations.toArray();

    expect(saved).toBeTruthy();
    expect(saved?.status).toBe('draft');
    expect(queue.some((item) => item.tableName === 'workout_sessions')).toBe(true);
  });
});
