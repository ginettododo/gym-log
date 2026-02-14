import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/offline/db';
import { shouldApplyRemoteRecord } from '@/lib/offline/sync-engine';
import { enqueueMutation, flushMutationQueue } from '@/lib/offline/sync';

const fakeTables = new Map<string, Map<string, Record<string, unknown>>>();
let failCount = 0;

vi.mock('@/lib/supabase/browser', () => ({
  createClient: () => ({
    from: (table: string) => ({
      upsert: (payload: Record<string, unknown>) => ({
        select: () => ({
          single: async () => {
            if (failCount > 0) {
              failCount -= 1;
              return { error: { status: 503, message: 'temporary outage' } };
            }
            if (!fakeTables.has(table)) {
              fakeTables.set(table, new Map());
            }
            const map = fakeTables.get(table)!;
            map.set(String(payload.id), payload);
            return { error: null };
          },
        }),
      }),
      delete: () => ({
        eq: async (_: string, id: string) => {
          fakeTables.get(table)?.delete(id);
          return { error: null };
        },
      }),
    }),
  }),
}));

describe('sync reliability', () => {
  beforeEach(async () => {
    fakeTables.clear();
    failCount = 0;
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true },
      configurable: true,
    });
    await db.delete();
    await db.open();
  });

  it('replay idempotente non duplica record', async () => {
    await enqueueMutation({
      userId: 'u1',
      tableName: 'set_entries',
      operation: 'upsert',
      payload: { id: 'rec-1', user_id: 'u1', reps: 5 },
      idempotencyKey: 'idem-1',
    });
    await enqueueMutation({
      userId: 'u1',
      tableName: 'set_entries',
      operation: 'upsert',
      payload: { id: 'rec-1', user_id: 'u1', reps: 5 },
      idempotencyKey: 'idem-1',
    });

    const flushed = await flushMutationQueue('u1');
    expect(flushed).toBe(2);
    expect(fakeTables.get('set_entries')?.size).toBe(1);
  });

  it('risoluzione conflitti local-first', () => {
    expect(
      shouldApplyRemoteRecord({
        hasPendingEdits: true,
        localClientUpdatedAt: '2026-01-01T10:00:00.000Z',
        remoteClientUpdatedAt: '2026-01-01T11:00:00.000Z',
      }),
    ).toBe(false);

    expect(
      shouldApplyRemoteRecord({
        hasPendingEdits: false,
        localClientUpdatedAt: '2026-01-01T10:00:00.000Z',
        remoteClientUpdatedAt: '2026-01-01T11:00:00.000Z',
      }),
    ).toBe(true);
  });

  it('retry con backoff su errore transient', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    failCount = 1;

    await enqueueMutation({
      userId: 'u1',
      tableName: 'workout_sessions',
      operation: 'upsert',
      payload: { id: 'session-1', user_id: 'u1' },
      idempotencyKey: 'idem-session-1',
    });

    const first = await flushMutationQueue('u1');
    expect(first).toBe(0);

    const queued = await db.syncMutations.toArray();
    expect(queued).toHaveLength(1);
    expect(queued[0].attempts).toBe(1);

    await db.syncMutations.update(queued[0].id, { nextAttemptAt: new Date(0).toISOString() });
    const second = await flushMutationQueue('u1');
    expect(second).toBe(1);
    expect(await db.syncMutations.count()).toBe(0);
  });
});
