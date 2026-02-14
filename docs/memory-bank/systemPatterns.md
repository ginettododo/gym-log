# System Patterns

- **Offline-first write path**: cache locale e coda mutazioni in IndexedDB.
- **Sync asincrono**: flush quando online + autenticato con retry incrementale.
- **Backend security-first**: Supabase con RLS su tutte le tabelle utente.
- **Incremental vertical slices**: schema + client + guard + backup minimale.

## Data model (aggiornato)

- `program_blocks`: contenitore di cicli/blocchi di progressione utente.
- `progression_rows`: pianificazione tabellare (week/day/exercise + target).
- `progression_actuals`: completamenti reali separati dal piano, per futura relazione 1:N con sessioni workout.
- `exercises.default_rest_seconds`: rest default opzionale per esercizio (override locale del rest globale).
- IndexedDB esteso con tabelle locali:
  - `workout_session_drafts`: stato draft/completed, note, resume dopo kill app.
  - `workout_exercise_drafts`: esercizi aggiunti alla sessione e ordine.
  - `set_entry_drafts`: set loggati localmente con campi peso/reps/rpe/rir/completamento.
  - `user_settings`: default rest globale per utente.

## Query strategy “Ultima volta”

1. Cerca nel cache locale (`workout_exercise_drafts` + `set_entry_drafts` + `workout_session_drafts`).
2. Se online e cache vuoto, fallback Supabase su `workout_exercises` + `set_entries` + `workout_sessions`.
3. Espone summary testuale + valori prefill (weight/reps) per inserimento rapido.
