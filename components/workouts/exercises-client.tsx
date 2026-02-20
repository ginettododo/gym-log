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
  const [saveMessage, setSaveMessage] = useState('');
  const [globalRestMessage, setGlobalRestMessage] = useState('');
  const [filter, setFilter] = useState('');

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
    setSaveMessage(`Esercizio "${name.trim()}" salvato!`);
    setTimeout(() => setSaveMessage(''), 3000);
    await refresh();
  }

  async function onSaveGlobalRest() {
    await updateUserDefaultRest(userId, Number(globalRest) || 120);
    setGlobalRestMessage('Rest globale aggiornato!');
    setTimeout(() => setGlobalRestMessage(''), 3000);
  }

  const filteredItems = filter.trim()
    ? items.filter((item) => item.name.toLowerCase().includes(filter.toLowerCase()))
    : items;

  return (
    <>
      <form onSubmit={onSubmit} className="card">
        <h2 style={{ marginTop: 0 }}>Nuovo esercizio</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome esercizio *" />
        <input value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="Attrezzo (opzionale)" />
        <input
          value={rest}
          onChange={(e) => setRest(e.target.value)}
          placeholder="Rest default (sec)"
          type="number"
        />
        <button type="submit" style={{ marginTop: '0.5rem' }}>
          Salva esercizio
        </button>
        {saveMessage && (
          <p style={{ color: '#22c55e', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>{saveMessage}</p>
        )}
      </form>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Rest globale di default</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={globalRest}
            onChange={(e) => setGlobalRest(e.target.value)}
            type="number"
            placeholder="Secondi"
            style={{ marginTop: 0 }}
          />
          <button type="button" onClick={onSaveGlobalRest} style={{ flexShrink: 0, marginTop: 0 }}>
            Salva
          </button>
        </div>
        {globalRestMessage && (
          <p style={{ color: '#22c55e', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>{globalRestMessage}</p>
        )}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Esercizi salvati ({items.length})</h2>
        {items.length > 4 && (
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtra esercizi..."
            style={{ marginBottom: '0.5rem' }}
          />
        )}
        {items.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Nessun esercizio ancora. Creane uno!</p>
        ) : filteredItems.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Nessun esercizio trovato per "{filter}".</p>
        ) : (
          <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {filteredItems.map((item) => (
              <li
                key={item.id}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                }}
              >
                <span style={{ fontWeight: 500 }}>{item.name}</span>
                {item.equipment && (
                  <span style={{ color: '#94a3b8', marginLeft: '0.5rem' }}>· {item.equipment}</span>
                )}
                {item.defaultRestSeconds && (
                  <span style={{ color: '#64748b', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                    · ⏱ {item.defaultRestSeconds}s
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
