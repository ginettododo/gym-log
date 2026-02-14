import Dexie, { type Table } from 'dexie';
import type { SyncMutation, WorkoutSessionDraft } from '@/lib/types';

export class GymLogDB extends Dexie {
  workoutSessionDrafts!: Table<WorkoutSessionDraft, string>;
  syncMutations!: Table<SyncMutation, string>;

  constructor() {
    super('gym-log-db');
    this.version(1).stores({
      workoutSessionDrafts: 'id, userId, updatedAt',
      syncMutations: 'id, userId, nextAttemptAt, createdAt',
    });
  }
}

export const db = new GymLogDB();
