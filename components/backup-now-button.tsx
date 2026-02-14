'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { db } from '@/lib/offline/db';

export function BackupNowButton({ userId }: { userId: string }) {
  const [messaggio, setMessaggio] = useState('');
  const [loading, setLoading] = useState(false);

  const backupNow = async () => {
    setLoading(true);
    setMessaggio('Backup in corso...');

    const drafts = await db.workoutSessionDrafts.where('userId').equals(userId).toArray();
    const queuedMutations = await db.syncMutations.where('userId').equals(userId).toArray();

    const snapshot = {
      schema_version: 1,
      created_at: new Date().toISOString(),
      local_cache: {
        workout_session_drafts: drafts,
        queued_mutations: queuedMutations,
      },
    };

    const supabase = createClient();
    const { error } = await supabase.from('backups').insert({
      user_id: userId,
      snapshot,
      created_at: new Date().toISOString(),
    });

    setLoading(false);
    setMessaggio(error ? `Errore backup: ${error.message}` : 'Backup completato con successo');
  };

  return (
    <div>
      <button type="button" onClick={backupNow} disabled={loading}>
        {loading ? 'Attendere...' : 'Backup ora'}
      </button>
      {messaggio ? <p>{messaggio}</p> : null}
    </div>
  );
}
