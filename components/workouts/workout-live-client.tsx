'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { findExerciseByName, listExercises } from '@/lib/data/exercises';
import { getExerciseLastTime } from '@/lib/data/prefill';
import {
  addExerciseToSession,
  appendSetFromPrevious,
  createEmptySet,
  finishWorkoutSession,
  getSessionVolume,
  getUserSetting,
  getWorkoutSession,
  listSetEntries,
  listWorkoutExercises,
  undoLastSet,
  upsertSessionNotes,
  upsertSetEntry,
} from '@/lib/data/workouts';
import { pauseTimer, resetTimer, startTimer, tickTimer, type RestTimerState } from '@/lib/rest-timer';
import type { Exercise, SetEntryDraft, WorkoutExerciseDraft, WorkoutSessionDraft } from '@/lib/types';

export function WorkoutLiveClient({ userId, sessionId }: { userId: string; sessionId: string }) {
  const [session, setSession] = useState<WorkoutSessionDraft>();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExerciseDraft[]>([]);
  const [setMap, setSetMap] = useState<Record<string, SetEntryDraft[]>>({});
  const [lastTimeMap, setLastTimeMap] = useState<Record<string, string>>({});
  const [timer, setTimer] = useState<RestTimerState>(startTimer(120));
  const [volume, setVolume] = useState(0);
  const [notesTimeout, setNotesTimeout] = useState<ReturnType<typeof setTimeout>>();

  const refresh = useCallback(async () => {
    const [sessionData, allExercises, sessionExercises, settings] = await Promise.all([
      getWorkoutSession(sessionId),
      listExercises(userId),
      listWorkoutExercises(sessionId),
      getUserSetting(userId),
    ]);
    setSession(sessionData);
    setExercises(allExercises);
    setWorkoutExercises(sessionExercises);
    setTimer((prev) => ({ ...prev, totalSeconds: settings.defaultRestSeconds, remainingSeconds: settings.defaultRestSeconds }));

    const nextSetMap: Record<string, SetEntryDraft[]> = {};
    for (const item of sessionExercises) {
      nextSetMap[item.id] = await listSetEntries(item.id);
    }
    setSetMap(nextSetMap);

    const lastTimeEntries = await Promise.all(
      sessionExercises.map(async (item) => {
        const summary = await getExerciseLastTime({ userId, exerciseId: item.exerciseId });
        return [item.exerciseId, summary.text] as const;
      }),
    );
    setLastTimeMap(Object.fromEntries(lastTimeEntries));

    setVolume(await getSessionVolume(sessionId));
  }, [sessionId, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((current) => tickTimer(current));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredExercises = useMemo(() => {
    if (!query.trim()) {
      return exercises.slice(0, 8);
    }
    const normalized = query.toLowerCase();
    return exercises.filter((item) => item.name.toLowerCase().includes(normalized)).slice(0, 8);
  }, [query, exercises]);

  async function onAddExercise(exerciseId: string) {
    const summary = await getExerciseLastTime({ userId, exerciseId });
    const exercise = exercises.find((item) => item.id === exerciseId);
    await addExerciseToSession({
      userId,
      sessionId,
      exerciseId,
      defaultWeight: summary.weight,
      defaultReps: summary.reps,
      restSeconds: exercise?.defaultRestSeconds,
    });
    setQuery('');
    await refresh();
  }

  async function onCreateExerciseFromQuery() {
    const existing = await findExerciseByName(userId, query);
    if (existing) {
      await onAddExercise(existing.id);
      return;
    }
  }

  async function updateSet(row: SetEntryDraft) {
    await upsertSetEntry(row);
    if (row.isCompleted) {
      const rest = workoutExercises.find((item) => item.id === row.workoutExerciseId)?.restSeconds ?? timer.totalSeconds;
      setTimer(startTimer(rest));
    }
    await refresh();
  }

  async function onFinishWorkout() {
    await finishWorkoutSession(sessionId);
    await refresh();
  }

  const statusLabel = navigator.onLine ? 'Online' : 'Offline';

  return (
    <>
      <section className="card">
        <p>Stato rete: {statusLabel}</p>
        <p>
          Inizio: {session ? new Date(session.startedAt).toLocaleTimeString('it-IT') : '-'} · Volume: {Math.round(volume)} kg
        </p>
        <textarea
          placeholder="Note sessione"
          value={session?.notes ?? ''}
          onChange={(event) => {
            const notes = event.target.value;
            setSession((current) => (current ? { ...current, notes } : current));
            if (notesTimeout) {
              clearTimeout(notesTimeout);
            }
            const timeout = setTimeout(() => {
              void upsertSessionNotes({ sessionId, notes });
            }, 250);
            setNotesTimeout(timeout);
          }}
        />
      </section>

      <section className="card">
        <h2>Aggiungi esercizio</h2>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca esercizio" />
        <button type="button" onClick={onCreateExerciseFromQuery}>
          Usa ricerca
        </button>
        <ul>
          {filteredExercises.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => onAddExercise(item.id)}>
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {workoutExercises.map((workoutExercise) => {
        const exercise = exercises.find((item) => item.id === workoutExercise.exerciseId);
        const sets = setMap[workoutExercise.id] ?? [];

        return (
          <section key={workoutExercise.id} className="card">
            <h3>{exercise?.name ?? 'Esercizio'}</h3>
            <p>{lastTimeMap[workoutExercise.exerciseId] ?? 'Ultima volta: -'}</p>
            {sets.map((set) => (
              <div key={set.id} style={{ borderBottom: '1px solid #ddd', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="number"
                  value={set.weight ?? ''}
                  placeholder="Kg"
                  onChange={(event) =>
                    updateSet({ ...set, weight: event.target.value ? Number(event.target.value) : undefined })
                  }
                />
                <input
                  type="number"
                  value={set.reps ?? ''}
                  placeholder="Reps"
                  onChange={(event) =>
                    updateSet({ ...set, reps: event.target.value ? Number(event.target.value) : undefined })
                  }
                />
                <input
                  type="number"
                  value={set.rpe ?? ''}
                  placeholder="RPE"
                  onChange={(event) =>
                    updateSet({ ...set, rpe: event.target.value ? Number(event.target.value) : undefined })
                  }
                />
                <input
                  type="number"
                  value={set.rir ?? ''}
                  placeholder="RIR"
                  onChange={(event) =>
                    updateSet({ ...set, rir: event.target.value ? Number(event.target.value) : undefined })
                  }
                />
                <select value={set.setType} onChange={(event) => updateSet({ ...set, setType: event.target.value as SetEntryDraft['setType'] })}>
                  <option value="warmup">Warm-up</option>
                  <option value="working">Working</option>
                  <option value="drop">Drop</option>
                  <option value="failure">Failure</option>
                </select>
                <label>
                  <input type="checkbox" checked={set.isCompleted} onChange={(event) => updateSet({ ...set, isCompleted: event.target.checked })} />
                  Completata
                </label>
              </div>
            ))}
            <p>
              <button type="button" onClick={() => createEmptySet({ userId, workoutExerciseId: workoutExercise.id }).then(refresh)}>
                + Set
              </button>{' '}
              <button type="button" onClick={() => appendSetFromPrevious(workoutExercise.id).then(refresh)}>
                Copia set precedente
              </button>{' '}
              <button type="button" onClick={() => undoLastSet(workoutExercise.id).then(refresh)}>
                Undo
              </button>
            </p>
          </section>
        );
      })}

      <section className="card" style={{ position: 'sticky', bottom: '1rem', background: '#fff' }}>
        <h2>Timer recupero</h2>
        <p>{Math.floor(timer.remainingSeconds / 60)}:{String(timer.remainingSeconds % 60).padStart(2, '0')}</p>
        <button type="button" onClick={() => setTimer(pauseTimer(timer))}>
          Pausa
        </button>{' '}
        <button type="button" onClick={() => setTimer(resetTimer(timer))}>
          Reset
        </button>
      </section>

      <section className="card">
        <button type="button" onClick={onFinishWorkout}>
          Termina allenamento
        </button>
        {session?.endedAt && <p>Allenamento salvato. Durata: {Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)} min</p>}
      </section>
    </>
  );
}
