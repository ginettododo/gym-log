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
