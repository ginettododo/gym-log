import { describe, expect, it } from 'vitest';
import { db } from '@/lib/offline/db';
import { getExerciseLastTime } from '@/lib/data/prefill';

describe('prefill last time', () => {
  it('usa cache locale come prima sorgente', async () => {
    const userId = 'u1';
    const exerciseId = 'e1';

    await db.workoutSessionDrafts.put({
      id: 's1',
      userId,
      startedAt: '2026-01-01T10:00:00.000Z',
      notes: '',
      status: 'completed',
      updatedAt: '2026-01-01T11:00:00.000Z',
      clientUpdatedAt: '2026-01-01T11:00:00.000Z',
      version: 1,
    });

    await db.workoutExerciseDrafts.put({
      id: 'we1',
      userId,
      sessionId: 's1',
      exerciseId,
      sort: 0,
      notes: '',
      updatedAt: '2026-01-01T11:00:00.000Z',
      clientUpdatedAt: '2026-01-01T11:00:00.000Z',
      version: 1,
    });

    await db.setEntryDrafts.put({
      id: 'set1',
      userId,
      workoutExerciseId: 'we1',
      setType: 'working',
      weight: 100,
      reps: 5,
      isCompleted: true,
      createdAt: '2026-01-01T10:30:00.000Z',
      updatedAt: '2026-01-01T10:30:00.000Z',
      clientUpdatedAt: '2026-01-01T10:30:00.000Z',
      version: 1,
    });

    const summary = await getExerciseLastTime({ userId, exerciseId });
    expect(summary.weight).toBe(100);
    expect(summary.reps).toBe(5);
    expect(summary.text).toContain('Ultima volta');
  });
});
