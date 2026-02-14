'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { flushMutationQueue, getSyncSnapshot } from '@/lib/offline/sync';

export function SyncStatus({ userId }: { userId: string }) {
  const [stato, setStato] = useState('In attesa di sincronizzazione');

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      await flushMutationQueue(userId);
      const snapshot = await getSyncSnapshot(userId);
      if (!mounted) {
        return;
      }
      if (snapshot.failed.length > 0) {
        setStato(`Sincronizzazione bloccata: ${snapshot.failed.length} errori`);
        return;
      }
      setStato(snapshot.queued > 0 ? `In coda ${snapshot.queued} modifiche` : 'Coda sincronizzata');
    };

    void refresh();
    const onlineHandler = () => void refresh();

    window.addEventListener('online', onlineHandler);
    return () => {
      mounted = false;
      window.removeEventListener('online', onlineHandler);
    };
  }, [userId]);

  return (
    <div>
      <p>{stato}</p>
      <Link href="/app/settings/sync">Apri pannello sync</Link>
    </div>
  );
}
