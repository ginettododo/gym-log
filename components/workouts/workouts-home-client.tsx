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
      <Link
        href="/app/workouts/new"
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '0.75rem',
          background: '#0ea5e9',
          color: '#0f172a',
          fontWeight: 700,
          borderRadius: '10px',
          textDecoration: 'none',
          marginBottom: '1rem',
        }}
      >
        + Inizia allenamento
      </Link>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <Link
          href="/app/exercises"
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '0.5rem',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '8px',
            textDecoration: 'none',
            color: '#e2e8f0',
            fontSize: '0.875rem',
          }}
        >
          Esercizi
        </Link>
        <Link
          href="/app/routines"
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '0.5rem',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '8px',
            textDecoration: 'none',
            color: '#e2e8f0',
            fontSize: '0.875rem',
          }}
        >
          Routine
        </Link>
      </div>
      <h2 style={{ marginTop: 0 }}>Sessioni recenti</h2>
      {sessions.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Nessuna sessione ancora. Inizia il primo allenamento!
        </p>
      ) : (
        <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sessions.slice(0, 8).map((session) => (
            <li key={session.id}>
              <Link
                href={`/app/workouts/${session.id}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 0.75rem',
                  background: '#0f172a',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  textDecoration: 'none',
                  color: '#e2e8f0',
                }}
              >
                <span>{new Date(session.startedAt).toLocaleString('it-IT')}</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: session.status === 'completed' ? '#22c55e' : '#f59e0b',
                    background:
                      session.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '999px',
                  }}
                >
                  {session.status === 'completed' ? 'Completato' : 'Bozza'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
