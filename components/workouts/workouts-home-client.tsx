'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listRecentSessions } from '@/lib/data/workouts';
import type { WorkoutSessionDraft } from '@/lib/types';

export function WorkoutsHomeClient({ userId }: { userId: string }) {
  const [sessions, setSessions] = useState<WorkoutSessionDraft[]>([]);

  useEffect(() => {
    listRecentSessions(userId).then(setSessions);
  }, [userId]);

  return (
    <section className="card">
      <p>
        <Link href="/app/workouts/new">Inizia allenamento</Link> · <Link href="/app/exercises">Esercizi</Link> ·{' '}
        <Link href="/app/routines">Routine</Link>
      </p>
      <h2>Sessioni recenti</h2>
      <ul>
        {sessions.slice(0, 8).map((session) => (
          <li key={session.id}>
            <Link href={`/app/workouts/${session.id}`}>
              {new Date(session.startedAt).toLocaleString('it-IT')} ·{' '}
              {session.status === 'completed' ? 'Completato' : 'Bozza'}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
