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
  const [searchMessage, setSearchMessage] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExerciseDraft[]>([]);
  const [setMap, setSetMap] = useState<Record<string, SetEntryDraft[]>>({});
  const [lastTimeMap, setLastTimeMap] = useState<Record<string, string>>({});
  const [timer, setTimer] = useState<RestTimerState>(startTimer(120));
  const [volume, setVolume] = useState(0);
  const [notesTimeout, setNotesTimeout] = useState<ReturnType<typeof setTimeout>>();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
    setTimer((prev) => ({
      ...prev,
      totalSeconds: settings.defaultRestSeconds,
      remainingSeconds: prev.remainingSeconds === prev.totalSeconds ? settings.defaultRestSeconds : prev.remainingSeconds,
    }));

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
    setSearchMessage('');
    await refresh();
  }

  async function onCreateExerciseFromQuery() {
    const trimmed = query.trim();
    if (!trimmed) return;
    const existing = await findExerciseByName(userId, trimmed);
    if (existing) {
      await onAddExercise(existing.id);
      return;
    }
    setSearchMessage(`Nessun esercizio trovato per "${trimmed}". Crea l'esercizio nella sezione Esercizi.`);
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
    if (!confirm('Terminare e salvare l\'allenamento?')) return;
    await finishWorkoutSession(sessionId);
    await refresh();
  }

  const timerMinutes = Math.floor(timer.remainingSeconds / 60);
  const timerSeconds = String(timer.remainingSeconds % 60).padStart(2, '0');
  const timerProgress = timer.totalSeconds > 0 ? timer.remainingSeconds / timer.totalSeconds : 1;
  const timerColor = timerProgress > 0.5 ? '#22c55e' : timerProgress > 0.2 ? '#f59e0b' : '#ef4444';

  return (
    <>
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: isOnline ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
            {isOnline ? '● Online' : '○ Offline'}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Inizio: {session ? new Date(session.startedAt).toLocaleTimeString('it-IT') : '-'}
          </span>
          <span style={{ fontWeight: 700 }}>Volume: {Math.round(volume)} kg</span>
        </div>
        <textarea
          placeholder="Note sessione"
          value={session?.notes ?? ''}
          style={{ marginTop: '0.75rem' }}
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
        <h2 style={{ marginTop: 0 }}>Aggiungi esercizio</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchMessage('');
            }}
            placeholder="Cerca esercizio..."
            style={{ marginTop: 0 }}
          />
          <button type="button" onClick={onCreateExerciseFromQuery} style={{ flexShrink: 0, marginTop: 0 }}>
            Cerca
          </button>
        </div>
        {searchMessage && (
          <p style={{ fontSize: '0.85rem', color: '#f59e0b', marginTop: '0.5rem' }}>{searchMessage}</p>
        )}
        {filteredExercises.length > 0 && (
          <ul style={{ margin: '0.5rem 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {filteredExercises.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onAddExercise(item.id)}
                  style={{ width: '100%', textAlign: 'left', background: '#0f172a', border: '1px solid #334155' }}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {workoutExercises.map((workoutExercise) => {
        const exercise = exercises.find((item) => item.id === workoutExercise.exerciseId);
        const sets = setMap[workoutExercise.id] ?? [];

        return (
          <section key={workoutExercise.id} className="card">
            <h3 style={{ marginTop: 0 }}>{exercise?.name ?? 'Esercizio'}</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.75rem' }}>
              {lastTimeMap[workoutExercise.exerciseId] ?? 'Ultima volta: —'}
            </p>
            <div style={{ display: 'flex', gap: '0.35rem', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', padding: '0 0.25rem' }}>
              <span style={{ flex: '1 1 0' }}>Kg</span>
              <span style={{ flex: '1 1 0' }}>Reps</span>
              <span style={{ flex: '1 1 0' }}>RPE</span>
              <span style={{ flex: '1 1 0' }}>RIR</span>
              <span style={{ flex: '1.5 1 0' }}>Tipo</span>
              <span style={{ flex: '0 0 auto', width: '2rem' }}></span>
            </div>
            {sets.map((set, index) => (
              <div
                key={set.id}
                style={{
                  display: 'flex',
                  gap: '0.35rem',
                  alignItems: 'center',
                  padding: '0.4rem 0.25rem',
                  borderRadius: '6px',
                  marginBottom: '0.35rem',
                  background: set.isCompleted ? 'rgba(34,197,94,0.08)' : 'transparent',
                  border: set.isCompleted ? '1px solid rgba(34,197,94,0.25)' : '1px solid transparent',
                }}
              >
                <span style={{ flex: '0 0 auto', width: '1.2rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                  {index + 1}
                </span>
                <input
                  type="number"
                  value={set.weight ?? ''}
                  placeholder="—"
                  style={{ flex: '1 1 0', marginTop: 0, padding: '0.4rem', textAlign: 'center' }}
                  onChange={(event) =>
                    updateSet({ ...set, weight: event.target.value ? Number(event.target.value) : undefined })
                  }
                />
                <input
                  type="number"
                  value={set.reps ?? ''}
                  placeholder="—"
                  style={{ flex: '1 1 0', marginTop: 0, padding: '0.4rem', textAlign: 'center' }}
                  onChange={(event) =>
                    updateSet({ ...set, reps: event.target.value ? Number(event.target.value) : undefined })
                  }
                />
                <input
                  type="number"
                  value={set.rpe ?? ''}
                  placeholder="—"
                  style={{ flex: '1 1 0', marginTop: 0, padding: '0.4rem', textAlign: 'center' }}
                  onChange={(event) =>
                    updateSet({ ...set, rpe: event.target.value ? Number(event.target.value) : undefined })
                  }
                />
                <input
                  type="number"
                  value={set.rir ?? ''}
                  placeholder="—"
                  style={{ flex: '1 1 0', marginTop: 0, padding: '0.4rem', textAlign: 'center' }}
                  onChange={(event) =>
                    updateSet({ ...set, rir: event.target.value ? Number(event.target.value) : undefined })
                  }
                />
                <select
                  value={set.setType}
                  style={{ flex: '1.5 1 0', marginTop: 0, padding: '0.4rem' }}
                  onChange={(event) => updateSet({ ...set, setType: event.target.value as SetEntryDraft['setType'] })}
                >
                  <option value="warmup">W-up</option>
                  <option value="working">Work</option>
                  <option value="drop">Drop</option>
                  <option value="failure">Fail</option>
                </select>
                <input
                  type="checkbox"
                  checked={set.isCompleted}
                  style={{ flex: '0 0 auto', width: '1.25rem', height: '1.25rem', marginTop: 0, cursor: 'pointer' }}
                  onChange={(event) => updateSet({ ...set, isCompleted: event.target.checked })}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => createEmptySet({ userId, workoutExerciseId: workoutExercise.id }).then(refresh)}
                style={{ flex: '1 1 auto' }}
              >
                + Set
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => appendSetFromPrevious(workoutExercise.id).then(refresh)}
                style={{ flex: '1 1 auto', border: '1px solid #334155' }}
              >
                Copia prec.
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => undoLastSet(workoutExercise.id).then(refresh)}
                style={{ flex: '1 1 auto', border: '1px solid #334155' }}
              >
                Undo
              </button>
            </div>
          </section>
        );
      })}

      <section
        className="card"
        style={{ position: 'sticky', bottom: '0.75rem', background: '#1e293b', border: '1px solid #334155', zIndex: 10 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Timer recupero</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
              {timerMinutes}:{timerSeconds}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={() => setTimer(pauseTimer(timer))} style={{ minWidth: '5rem' }}>
              {timer.running ? 'Pausa' : 'Riprendi'}
            </button>
            <button type="button" className="secondary" onClick={() => setTimer(resetTimer(timer))} style={{ border: '1px solid #334155' }}>
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        {session?.status === 'completed' ? (
          <div style={{ color: '#22c55e', fontWeight: 600 }}>
            ✓ Allenamento completato — Durata:{' '}
            {Math.round(
              (new Date(session.endedAt!).getTime() - new Date(session.startedAt).getTime()) / 60000,
            )}{' '}
            min
          </div>
        ) : (
          <button type="button" onClick={onFinishWorkout} style={{ width: '100%', background: '#22c55e', color: '#0f172a' }}>
            Termina allenamento
          </button>
        )}
      </section>
    </>
  );
}
