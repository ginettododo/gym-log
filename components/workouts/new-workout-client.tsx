'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { listRoutines } from '@/lib/data/routines';
import { createWorkoutSessionDraft } from '@/lib/data/workouts';
import type { Routine } from '@/lib/types';

export function NewWorkoutClient({ userId }: { userId: string }) {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);

  useEffect(() => {
    listRoutines(userId).then(setRoutines);
  }, [userId]);

  async function start(routineId?: string) {
    const draft = await createWorkoutSessionDraft({ userId, routineId });
    router.push(`/app/workouts/${draft.id}`);
  }

  return (
    <div className="card">
      <button type="button" onClick={() => start()}>
        Allenamento libero
      </button>
      <h2>Oppure scegli una routine</h2>
      {routines.length === 0 && <p>Nessuna routine disponibile.</p>}
      <ul>
        {routines.map((routine) => (
          <li key={routine.id}>
            <button type="button" onClick={() => start(routine.id)}>
              {routine.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
