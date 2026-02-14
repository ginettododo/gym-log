import Dexie, { type Table } from 'dexie';
import type {
  Exercise,
  ProgramBlock,
  ProgressionActual,
  ProgressionRow,
  Routine,
  RoutineExercise,
  SetEntryDraft,
  SyncLogEvent,
  SyncMutation,
  SyncState,
  UserSetting,
  WorkoutExerciseDraft,
  WorkoutSessionDraft,
} from '@/lib/types';

export class GymLogDB extends Dexie {
  workoutSessionDrafts!: Table<WorkoutSessionDraft, string>;
  workoutExerciseDrafts!: Table<WorkoutExerciseDraft, string>;
  setEntryDrafts!: Table<SetEntryDraft, string>;
  syncMutations!: Table<SyncMutation, string>;
  syncLogs!: Table<SyncLogEvent, string>;
  syncState!: Table<SyncState, string>;
  exercises!: Table<Exercise, string>;
  routines!: Table<Routine, string>;
  routineExercises!: Table<RoutineExercise, string>;
  userSettings!: Table<UserSetting, string>;
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

    this.version(3).stores({
      workoutSessionDrafts: 'id, userId, status, startedAt, updatedAt, clientUpdatedAt',
      workoutExerciseDrafts: 'id, userId, sessionId, exerciseId, sort, updatedAt, clientUpdatedAt',
      setEntryDrafts: 'id, userId, workoutExerciseId, isCompleted, createdAt, clientUpdatedAt',
      syncMutations: 'id, userId, tableName, nextAttemptAt, createdAt',
      exercises: 'id, userId, name, clientUpdatedAt',
      routines: 'id, userId, name, clientUpdatedAt, deletedAt',
      routineExercises: 'id, userId, routineId, exerciseId, sort, clientUpdatedAt, deletedAt',
      userSettings: 'userId, updatedAt',
      programBlocks: 'id, userId, name, clientUpdatedAt, deletedAt',
      progressionRows:
        'id, userId, programBlockId, week, day, exerciseId, clientUpdatedAt, deletedAt',
      progressionActuals: 'id, userId, progressionRowId, date, clientUpdatedAt, deletedAt',
    });

    this.version(4)
      .stores({
        workoutSessionDrafts: 'id, userId, status, startedAt, updatedAt, clientUpdatedAt',
        workoutExerciseDrafts: 'id, userId, sessionId, exerciseId, sort, updatedAt, clientUpdatedAt',
        setEntryDrafts: 'id, userId, workoutExerciseId, isCompleted, createdAt, updatedAt, clientUpdatedAt',
        syncMutations:
          'id, userId, tableName, recordId, status, transactionGroup, orderingKey, nextAttemptAt, createdAt, idempotencyKey',
        syncLogs: 'id, userId, createdAt',
        syncState: 'userId, lastSyncAt',
        exercises: 'id, userId, name, clientUpdatedAt',
        routines: 'id, userId, name, clientUpdatedAt, deletedAt',
        routineExercises: 'id, userId, routineId, exerciseId, sort, clientUpdatedAt, deletedAt',
        userSettings: 'userId, updatedAt',
        programBlocks: 'id, userId, name, clientUpdatedAt, version, deletedAt',
        progressionRows:
          'id, userId, programBlockId, week, day, exerciseId, clientUpdatedAt, version, deletedAt',
        progressionActuals: 'id, userId, progressionRowId, date, clientUpdatedAt, version, deletedAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('syncMutations')
          .toCollection()
          .modify((item: Partial<SyncMutation>) => {
            item.recordId = typeof item.payload === 'object' && item.payload && 'id' in item.payload ? String((item.payload as Record<string, unknown>).id ?? '') : '';
            item.status = 'queued';
            item.transactionGroup = item.transactionGroup ?? item.id ?? crypto.randomUUID();
            item.orderingKey = item.orderingKey ?? 100;
          });
      });
  }
}

export const db = new GymLogDB();
