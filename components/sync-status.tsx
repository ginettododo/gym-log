'use client';

import { useEffect, useState } from 'react';
import { flushMutationQueue } from '@/lib/offline/sync';

export function SyncStatus({ userId }: { userId: string }) {
  const [stato, setStato] = useState('In attesa di sincronizzazione');

  useEffect(() => {
    let mounted = true;

    const flush = async () => {
      const count = await flushMutationQueue(userId);
      if (mounted) {
        setStato(
          count > 0
            ? `Sincronizzate ${count} modifiche locali`
            : 'Nessuna modifica da sincronizzare',
        );
      }
    };

    void flush();

    const onlineHandler = () => {
      void flush();
    };

    window.addEventListener('online', onlineHandler);
    return () => {
      mounted = false;
      window.removeEventListener('online', onlineHandler);
    };
  }, [userId]);

  return <p>{stato}</p>;
}
