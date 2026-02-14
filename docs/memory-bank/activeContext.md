# Active Context

## Focus attuale

Consegna Task #3: esperienza logging allenamento mobile-first offline-first con timer recupero e prefill ultima sessione.

## Decisioni

- Nuove superfici app: workouts list/start/live + gestione esercizi/routine minimale.
- Persistenza locale estesa via Dexie (session draft, exercise draft, set draft, user settings).
- Prefill “Ultima volta” local-first con fallback Supabase quando online.
- Rest timer a stato puro (`lib/rest-timer.ts`) per test unitario semplice.
