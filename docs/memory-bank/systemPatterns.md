# System Patterns

- **Offline-first write path**: cache locale e coda mutazioni in IndexedDB.
- **Sync asincrono**: flush quando online + autenticato con retry incrementale.
- **Backend security-first**: Supabase con RLS su tutte le tabelle utente.
- **Incremental vertical slices**: schema + client + guard + backup minimale.

## Data model (aggiornato)

- `program_blocks`: contenitore di cicli/blocchi di progressione utente.
- `progression_rows`: pianificazione tabellare (week/day/exercise + target).
- `progression_actuals`: completamenti reali separati dal piano, per futura relazione 1:N con sessioni workout.
