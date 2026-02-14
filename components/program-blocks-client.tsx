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
      <h2>Blocchi Programma</h2>
      <label htmlFor="blockName">Nuovo blocco</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input id="blockName" value={name} onChange={(event) => setName(event.target.value)} />
        <button
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
      <ul>
        {items.map((item) => (
          <li key={item.id} style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <Link href={`/app/programs/${item.id}`}>{item.name}</Link>
              <button
                className="secondary"
                onClick={async () => {
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
    </div>
  );
}
