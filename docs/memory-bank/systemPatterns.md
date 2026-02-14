# System Patterns

- **Offline-first write path**: cache locale + coda mutazioni in IndexedDB; ogni mutazione ha `idempotencyKey` stabile per replay sicuro.
- **Sync asincrono robusto**: flush quando online+autenticato con batch ordinati per `transactionGroup` e `orderingKey` (es. sessione -> esercizio -> set).
- **Idempotenza server/client**: upsert con `onConflict: id` + metadati `version`, `updated_at`, `client_updated_at`; tabella SQL `sync_idempotency_keys` pronta per deduplica server-side evolutiva.
- **Conflict strategy local-first**:
  1. Se esistono mutazioni locali pending per record, il record remoto non sovrascrive il locale.
  2. Se non ci sono pending locali, vince il record con `client_updated_at` più recente.
  3. `version` incrementale per audit/debug conflitti su sessioni, set, progression rows/actuals.
- **Error taxonomy sync**:
  - auth (`401/403`) => stato `auth_required`, stop retry automatico.
  - permission/RLS => stato `permission_denied`, visibile in UI.
  - network/transient => retry con exponential backoff + jitter.
  - validation => stato `failed` con messaggio errore persistito.
- **Osservabilità locale**: tabella `syncLogs` in IndexedDB con ultimi N eventi e `syncState.lastSyncAt`.
- **UI diagnostica**: `/app/settings/sync` con coda, ultimo sync, errori, azioni “Riprova tutte” e “Esporta errori”.

## Data model (aggiornato)

- `workout_sessions`, `workout_exercises`, `set_entries`: colonne `updated_at` + `version` per merge affidabile multi-device.
- `program_blocks`, `progression_rows`, `progression_actuals`: colonna `version`.
- IndexedDB esteso:
  - `syncMutations`: `status`, `transactionGroup`, `orderingKey`, `recordId`, `lastError*`.
  - `syncLogs`: eventi sync locali.
  - `syncState`: ultimo sync riuscito per utente.
