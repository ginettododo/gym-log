# Progress

## Stato task

- **Task #1 – Scaffold tecnico end-to-end**: **Done**

## Consegnato

- Scaffold Next.js + TypeScript + ESLint + Prettier.
- PWA baseline (manifest + service worker + registrazione client).
- Supabase auth Google con callback e route protetta `/app`.
- Migrazione SQL con schema minimo + RLS + trigger profilo.
- IndexedDB (Dexie) per draft locali e coda sync con retry.
- Pagina `/app/settings` con bottone "Backup ora" su tabella `backups`.

## Prossimi task atomici

1. Aggiungere modello dati e UI minima per creazione workout session reale offline.
2. Implementare idempotency tracking server-side (tabella `sync_operations`).
3. Introdurre test end-to-end (auth redirect, guard, backup flow).
4. Aggiungere importazione programmi/progressioni da CSV/JSON tabellare.
