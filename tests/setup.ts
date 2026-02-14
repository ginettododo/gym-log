import 'fake-indexeddb/auto';
import { beforeEach } from 'vitest';
import { db } from '@/lib/offline/db';

Object.defineProperty(globalThis, 'navigator', {
  value: { onLine: false },
  configurable: true,
});

beforeEach(async () => {
  await db.delete();
  await db.open();
});
