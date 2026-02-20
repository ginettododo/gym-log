'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { createProgramBlock, deleteProgramBlock, listProgramBlocks } from '@/lib/data/programs';
import type { ProgramBlock } from '@/lib/types';

export function ProgramBlocksClient({ userId }: { userId: string }) {
  const [items, setItems] = useState<ProgramBlock[]>([]);
  const [name, setName] = useState('');

  const refresh = useCallback(async () => {
    const data = await listProgramBlocks(userId);
    setItems(data);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Blocchi Programma</h2>
      <label htmlFor="blockName" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
        Nuovo blocco
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
        <input
          id="blockName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome blocco..."
          style={{ marginTop: 0 }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && name.trim()) {
              void createProgramBlock({ userId, name }).then(() => {
                setName('');
                void refresh();
              });
            }
          }}
        />
        <button
          type="button"
          style={{ flexShrink: 0, marginTop: 0 }}
          onClick={async () => {
            if (!name.trim()) return;
            await createProgramBlock({ userId, name });
            setName('');
            await refresh();
          }}
        >
          Crea
        </button>
      </div>
      {items.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '1rem' }}>
          Nessun blocco ancora. Crea il primo programma!
        </p>
      ) : (
        <ul style={{ padding: 0, margin: '1rem 0 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map((item) => (
            <li key={item.id}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 0.75rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              >
                <Link href={`/app/programs/${item.id}`} style={{ fontWeight: 500 }}>
                  {item.name}
                </Link>
                <button
                  type="button"
                  className="secondary"
                  style={{ minHeight: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem', border: '1px solid #ef4444', color: '#ef4444' }}
                  onClick={async () => {
                    if (!confirm(`Eliminare il blocco "${item.name}"?`)) return;
                    await deleteProgramBlock({ userId, id: item.id });
                    await refresh();
                  }}
                >
                  Elimina
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
