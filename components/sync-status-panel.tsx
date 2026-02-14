'use client';

import { useCallback, useEffect, useState } from 'react';
import { exportFailedMutations, flushMutationQueue, getSyncSnapshot, retryAllMutations } from '@/lib/offline/sync';

export function SyncStatusPanel({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getSyncSnapshot>> | null>(null);

  const refresh = useCallback(async () => {
    const data = await getSyncSnapshot(userId);
    setSnapshot(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onRetryAll = async () => {
    await retryAllMutations(userId);
    await flushMutationQueue(userId);
    await refresh();
  };

  const onExportFailed = async () => {
    const content = await exportFailedMutations(userId);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sync-failed-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !snapshot) {
    return <p>Caricamento stato sincronizzazione...</p>;
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <p>Mutazioni in coda: {snapshot.queued}</p>
      <p>Ultima sincronizzazione: {snapshot.lastSyncAt ? new Date(snapshot.lastSyncAt).toLocaleString('it-IT') : 'Mai'}</p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" onClick={onRetryAll}>Riprova tutte</button>
        <button type="button" onClick={onExportFailed}>Esporta errori</button>
      </div>
      <section>
        <h2>Mutazioni fallite</h2>
        {snapshot.failed.length === 0 ? (
          <p>Nessun errore bloccante.</p>
        ) : (
          <ul>
            {snapshot.failed.map((item) => (
              <li key={item.id}>
                <strong>{item.tableName}</strong> ({item.operation}) — {item.lastErrorMessage ?? 'Errore non disponibile'}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
