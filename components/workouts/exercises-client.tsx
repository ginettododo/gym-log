'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { createExercise, listExercises } from '@/lib/data/exercises';
import { getUserSetting, updateUserDefaultRest } from '@/lib/data/workouts';
import type { Exercise } from '@/lib/types';

export function ExercisesClient({ userId }: { userId: string }) {
  const [name, setName] = useState('');
  const [equipment, setEquipment] = useState('');
  const [rest, setRest] = useState('120');
  const [globalRest, setGlobalRest] = useState('120');
  const [items, setItems] = useState<Exercise[]>([]);

  const refresh = useCallback(async () => {
    const [all, settings] = await Promise.all([listExercises(userId), getUserSetting(userId)]);
    setItems(all);
    setGlobalRest(String(settings.defaultRestSeconds));
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    await createExercise({
      userId,
      name,
      equipment,
      defaultRestSeconds: Number(rest) || undefined,
    });
    setName('');
    setEquipment('');
    setRest(globalRest);
    await refresh();
  }

  return (
    <>
      <form onSubmit={onSubmit} className="card">
        <h2>Nuovo esercizio</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome esercizio" />
        <input value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="Attrezzo" />
        <input value={rest} onChange={(e) => setRest(e.target.value)} placeholder="Rest default (sec)" />
        <button type="submit">Salva esercizio</button>
      </form>
      <section className="card">
        <h2>Rest globale</h2>
        <input value={globalRest} onChange={(e) => setGlobalRest(e.target.value)} />
        <button type="button" onClick={() => updateUserDefaultRest(userId, Number(globalRest) || 120)}>
          Salva rest globale
        </button>
      </section>
      <section className="card">
        <h2>Esercizi salvati</h2>
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              {item.name} {item.equipment ? `· ${item.equipment}` : ''}{' '}
              {item.defaultRestSeconds ? `· Rest ${item.defaultRestSeconds}s` : ''}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
