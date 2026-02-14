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
  notes: string;
  updatedAt: string;
}

export interface SyncMutation {
  id: string;
  userId: string;
  tableName: string;
  operation: 'upsert' | 'delete';
  payload: JsonValue;
  attempts: number;
  nextAttemptAt: string;
  createdAt: string;
  idempotencyKey: string;
}

export interface Exercise {
  id: string;
  userId: string;
  name: string;
  muscleGroups: string[];
  equipment: string;
  createdAt: string;
  clientUpdatedAt: string;
}

export interface ProgramBlock {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  clientUpdatedAt: string;
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
