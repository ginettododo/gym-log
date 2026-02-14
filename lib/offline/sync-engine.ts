import type { SyncMutation, SyncMutationStatus } from '@/lib/types';

export type SyncErrorType = 'network' | 'auth' | 'permission' | 'validation' | 'unknown';

const TRANSIENT_HTTP = new Set([408, 425, 429, 500, 502, 503, 504]);

export function computeBackoffMs(attempts: number, baseMs = 1500, maxMs = 120000): number {
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(baseMs * 2 ** Math.min(attempts, 8) + jitter, maxMs);
}

export function classifySyncError(error: unknown): SyncErrorType {
  if (!error || typeof error !== 'object') {
    return 'unknown';
  }

  const maybeError = error as { status?: number; code?: string; message?: string; name?: string };
  const message = `${maybeError.message ?? ''}`.toLowerCase();

  if (maybeError.name === 'TypeError' || message.includes('failed to fetch') || message.includes('network')) {
    return 'network';
  }

  if (maybeError.status === 401 || maybeError.status === 403 || maybeError.code === 'PGRST301') {
    return 'auth';
  }

  if (maybeError.code === '42501' || message.includes('row-level security') || message.includes('permission')) {
    return 'permission';
  }

  if (maybeError.status && TRANSIENT_HTTP.has(maybeError.status)) {
    return 'network';
  }

  if ((maybeError.status && maybeError.status >= 400 && maybeError.status < 500) || maybeError.code === '23514') {
    return 'validation';
  }

  return 'unknown';
}

export function mutationStatusForError(errorType: SyncErrorType): SyncMutationStatus {
  if (errorType === 'auth') {
    return 'auth_required';
  }

  if (errorType === 'permission') {
    return 'permission_denied';
  }

  if (errorType === 'validation') {
    return 'failed';
  }

  return 'queued';
}

export function shouldApplyRemoteRecord(params: {
  hasPendingEdits: boolean;
  localClientUpdatedAt?: string;
  remoteClientUpdatedAt?: string;
}): boolean {
  if (params.hasPendingEdits) {
    return false;
  }

  if (!params.remoteClientUpdatedAt) {
    return false;
  }

  if (!params.localClientUpdatedAt) {
    return true;
  }

  return new Date(params.remoteClientUpdatedAt).getTime() > new Date(params.localClientUpdatedAt).getTime();
}

export function sortMutationsForFlush(mutations: SyncMutation[]): SyncMutation[] {
  return [...mutations].sort((a, b) => {
    if (a.transactionGroup !== b.transactionGroup) {
      return a.createdAt.localeCompare(b.createdAt);
    }
    if (a.orderingKey !== b.orderingKey) {
      return a.orderingKey - b.orderingKey;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
}
