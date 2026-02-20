'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { flushMutationQueue, getSyncSnapshot } from '@/lib/offline/sync';

type SyncState = 'synced' | 'pending' | 'error' | 'loading';

export function SyncStatus({ userId }: { userId: string }) {
  const [stato, setStato] = useState('In attesa di sincronizzazione...');
  const [syncState, setSyncState] = useState<SyncState>('loading');

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      await flushMutationQueue(userId);
      const snapshot = await getSyncSnapshot(userId);
      if (!mounted) {
        return;
      }
      if (snapshot.failed.length > 0) {
        setStato(`${snapshot.failed.length} errore${snapshot.failed.length > 1 ? 'i' : ''} di sincronizzazione`);
        setSyncState('error');
        return;
      }
      if (snapshot.queued > 0) {
        setStato(`${snapshot.queued} modifica${snapshot.queued > 1 ? 'he' : ''} in coda`);
        setSyncState('pending');
        return;
      }
      setStato('Sincronizzato');
      setSyncState('synced');
    };

    void refresh();
    const onlineHandler = () => void refresh();

    window.addEventListener('online', onlineHandler);
    return () => {
      mounted = false;
      window.removeEventListener('online', onlineHandler);
    };
  }, [userId]);

  const color = syncState === 'synced' ? '#22c55e' : syncState === 'error' ? '#ef4444' : syncState === 'pending' ? '#f59e0b' : '#94a3b8';
  const dot = syncState === 'synced' ? '●' : syncState === 'error' ? '●' : syncState === 'pending' ? '●' : '○';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color, fontWeight: 600, fontSize: '0.9rem' }}>
        {dot} {stato}
      </span>
      <Link href="/app/settings/sync" style={{ fontSize: '0.8rem' }}>
        Dettagli
      </Link>
    </div>
  );
}
