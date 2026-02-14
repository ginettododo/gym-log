export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export interface WorkoutSessionDraft {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  notes: string;
  routineId?: string;
  status: 'draft' | 'completed';
  updatedAt: string;
  clientUpdatedAt: string;
  version: number;
}

export type SetType = 'warmup' | 'working' | 'drop' | 'failure';

export interface WorkoutExerciseDraft {
  id: string;
  userId: string;
  sessionId: string;
  exerciseId: string;
  sort: number;
  notes: string;
  restSeconds?: number;
  updatedAt: string;
  clientUpdatedAt: string;
  version: number;
}

export interface SetEntryDraft {
  id: string;
  userId: string;
  workoutExerciseId: string;
  setType: SetType;
  weight?: number;
  reps?: number;
  rpe?: number;
  rir?: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  clientUpdatedAt: string;
  version: number;
}

export type SyncMutationStatus = 'queued' | 'failed' | 'auth_required' | 'permission_denied';

export interface SyncMutation {
  id: string;
  userId: string;
  tableName: string;
  operation: 'upsert' | 'delete';
  payload: JsonValue;
  recordId: string;
  orderingKey: number;
  transactionGroup: string;
  attempts: number;
  nextAttemptAt: string;
  createdAt: string;
  lastAttemptAt?: string;
  idempotencyKey: string;
  status: SyncMutationStatus;
  lastErrorCode?: string;
  lastErrorMessage?: string;
}

export interface SyncLogEvent {
  id: string;
  userId: string;
  createdAt: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  details?: string;
}

export interface SyncState {
  userId: string;
  lastSyncAt?: string;
}

export interface Exercise {
  id: string;
  userId: string;
  name: string;
  muscleGroups: string[];
  equipment: string;
  defaultRestSeconds?: number;
  createdAt: string;
  clientUpdatedAt: string;
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  clientUpdatedAt: string;
  deletedAt?: string;
}

export interface RoutineExercise {
  id: string;
  userId: string;
  routineId: string;
  exerciseId: string;
  sort: number;
  notes?: string;
  createdAt: string;
  clientUpdatedAt: string;
  deletedAt?: string;
}

export interface UserSetting {
  userId: string;
  defaultRestSeconds: number;
  updatedAt: string;
}

export interface ProgramBlock {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  clientUpdatedAt: string;
  version: number;
  deletedAt?: string;
}

export interface ProgressionRow {
  id: string;
  userId: string;
  programBlockId: string;
  week: number;
  day: number;
  exerciseId: string;
  targetSets: number;
  targetReps: string;
  targetLoad?: number;
  targetRpe?: number;
  notes?: string;
  createdAt: string;
  clientUpdatedAt: string;
  version: number;
  deletedAt?: string;
}

export interface ProgressionActual {
  id: string;
  userId: string;
  progressionRowId: string;
  date: string;
  actualWeight?: number;
  actualReps?: number;
  actualRpe?: number;
  notes?: string;
  createdAt: string;
  clientUpdatedAt: string;
  version: number;
  deletedAt?: string;
}

export interface CsvProgressionRowInput {
  program_block_name: string;
  week: string;
  day: string;
  exercise_name: string;
  target_sets: string;
  target_reps: string;
  target_load?: string;
  target_rpe?: string;
  notes?: string;
}
