# Progress

## Stato task

- **Task #1 – Scaffold tecnico end-to-end**: **Done**
- **Task #2 – Program Blocks + Progression Tables + CSV import**: **Done**
- **Task #3 – Workout logging core (offline + prefill + rest timer)**: **Done**

## Consegnato

- Flusso allenamenti con route: `/app/workouts`, `/app/workouts/new`, `/app/workouts/[id]`.
- Gestione libreria esercizi e routine template: `/app/exercises`, `/app/routines`.
- Persistenza locale estesa (sessioni, esercizi sessione, set, impostazioni utente) con Dexie + enqueue mutazioni sync.
- Schermata live logging con prefill “Ultima volta”, set rows modificabili, quick actions (`+ Set`, copia, undo), note sessione.
- Rest timer automatico su completamento set con controlli pausa/reset e default configurabile.
- Test unitari: prefill last-time, rest timer; test integrazione minima: creazione draft locale.

## Prossimi task atomici

4. Sync hardening + conflict strategy + idempotency end-to-end (retry policy, deduplica mutazioni, risoluzione conflitti `client_updated_at`).
5. Analytics (PR + charts) con filtri base per blocco temporale e esercizio.
6. Hardening UX allenamento live: virtualizzazione set lunghi, autosave notes senza re-render, recovery robusto su auth scaduta.
7. Editing routine avanzato (riordino drag/tap-friendly + rimozione esercizi + preset rest per esercizio).
