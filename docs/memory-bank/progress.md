# Progress

## Stato task

- **Task #1 – Scaffold tecnico end-to-end**: **Done**
- **Task #2 – Program Blocks + Progression Tables + CSV import**: **Done**

## Consegnato

- Scaffold Next.js + TypeScript + ESLint + Prettier.
- PWA baseline (manifest + service worker + registrazione client).
- Supabase auth Google con callback e route protetta `/app`.
- Migrazione SQL con schema minimo + RLS + trigger profilo.
- IndexedDB (Dexie) per draft locali e coda sync con retry.
- Pagina `/app/settings` con bottone "Backup ora" su tabella `backups`.
- Workflow programmi/progressioni con pagine `/app/programs`, `/app/programs/[id]` e import wizard `/app/import`.
- Import CSV offline-first con validazione, preview ed enqueue mutazioni per sync.

## Prossimi task atomici

3. Workout logging UI + prefill ultima sessione + rest timer.
4. Sync hardening + conflict strategy + idempotency.
5. Analytics (PR + charts).
