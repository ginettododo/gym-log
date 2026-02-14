# Progress

## Stato task

- **Task #1 – Scaffold tecnico end-to-end**: **Done**
- **Task #2 – Program Blocks + Progression Tables + CSV import**: **Done**
- **Task #3 – Workout logging core (offline + prefill + rest timer)**: **Done**
- **Task #4 – Sync hardening + conflict strategy + idempotency end-to-end**: **Done**

## Consegnato

- Coda sync robusta con:
  - idempotency key stabile per mutazione,
  - stati mutazione (`queued`, `failed`, `auth_required`, `permission_denied`),
  - retry exponential backoff con jitter,
  - classificazione errori (auth/RLS/network/validation).
- Ordinamento flush per dipendenze (`transactionGroup` + `orderingKey`) e batching logico.
- Osservabilità locale: log eventi sync e timestamp ultimo sync riuscito.
- Conflict strategy local-first implementata su merge remoto per sessioni e progression rows (`client_updated_at` + pending edits).
- UI diagnostica `/app/settings/sync` con conteggio coda, ultimo sync, mutazioni fallite, azioni “Riprova tutte” e “Esporta errori”.
- Migrazione SQL `0004_sync_reliability.sql` con colonne `updated_at`/`version` e tabella `sync_idempotency_keys` con RLS.
- Test unitari aggiunti per replay idempotente, regole conflitto, retry/backoff deterministico.

## Prossimi task atomici

5. Analytics (PR + charts) con filtri base per blocco temporale e esercizio.
6. Hardening UX allenamento live: virtualizzazione set lunghi, autosave notes senza re-render, recovery robusto su auth scaduta.
7. Editing routine avanzato (riordino drag/tap-friendly + rimozione esercizi + preset rest per esercizio).
