'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { listExercises } from '@/lib/data/exercises';
import { addExerciseToRoutine, createRoutine, listRoutineExercises, listRoutines } from '@/lib/data/routines';
import type { Exercise, Routine, RoutineExercise } from '@/lib/types';

export function RoutinesClient({ userId }: { userId: string }) {
  const [name, setName] = useState('');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);

  const refresh = useCallback(async () => {
    const [routinesData, exercisesData] = await Promise.all([listRoutines(userId), listExercises(userId)]);
    setRoutines(routinesData);
    setExercises(exercisesData);
    if (!selectedRoutineId && routinesData[0]) {
      setSelectedRoutineId(routinesData[0].id);
    }
  }, [selectedRoutineId, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedRoutineId) {
      return;
    }
    listRoutineExercises(selectedRoutineId).then(setRoutineExercises);
  }, [selectedRoutineId]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    const routine = await createRoutine({ userId, name });
    setName('');
    setSelectedRoutineId(routine.id);
    await refresh();
  }

  async function onAddExercise() {
    if (!selectedRoutineId || !selectedExerciseId) {
      return;
    }
    await addExerciseToRoutine({ userId, routineId: selectedRoutineId, exerciseId: selectedExerciseId });
    const items = await listRoutineExercises(selectedRoutineId);
    setRoutineExercises(items);
  }

  return (
    <>
      <form onSubmit={onCreate} className="card">
        <h2>Nuova routine</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome routine" />
        <button type="submit">Crea routine</button>
      </form>
      <section className="card">
        <h2>Template routine</h2>
        <select value={selectedRoutineId} onChange={(e) => setSelectedRoutineId(e.target.value)}>
          <option value="">Seleziona routine</option>
          {routines.map((routine) => (
            <option key={routine.id} value={routine.id}>
              {routine.name}
            </option>
          ))}
        </select>
        <div>
          <select value={selectedExerciseId} onChange={(e) => setSelectedExerciseId(e.target.value)}>
            <option value="">Aggiungi esercizio</option>
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={onAddExercise}>
            Aggiungi
          </button>
        </div>
        <ul>
          {routineExercises.map((item) => {
            const exercise = exercises.find((candidate) => candidate.id === item.exerciseId);
            return <li key={item.id}>{exercise?.name ?? 'Esercizio'}</li>;
          })}
        </ul>
      </section>
    </>
  );
}
