import Dexie, { type Table } from 'dexie';
import type {
  Exercise,
  ProgramBlock,
  ProgressionActual,
  ProgressionRow,
  SyncMutation,
  WorkoutSessionDraft,
} from '@/lib/types';

export class GymLogDB extends Dexie {
  workoutSessionDrafts!: Table<WorkoutSessionDraft, string>;
  syncMutations!: Table<SyncMutation, string>;
  exercises!: Table<Exercise, string>;
  programBlocks!: Table<ProgramBlock, string>;
  progressionRows!: Table<ProgressionRow, string>;
  progressionActuals!: Table<ProgressionActual, string>;

  constructor() {
    super('gym-log-db');

    this.version(1).stores({
      workoutSessionDrafts: 'id, userId, updatedAt',
      syncMutations: 'id, userId, nextAttemptAt, createdAt',
    });

    this.version(2).stores({
      workoutSessionDrafts: 'id, userId, updatedAt',
      syncMutations: 'id, userId, nextAttemptAt, createdAt',
      exercises: 'id, userId, name, clientUpdatedAt',
      programBlocks: 'id, userId, name, clientUpdatedAt, deletedAt',
      progressionRows:
        'id, userId, programBlockId, week, day, exerciseId, clientUpdatedAt, deletedAt',
      progressionActuals: 'id, userId, progressionRowId, date, clientUpdatedAt, deletedAt',
    });
  }
}

export const db = new GymLogDB();
