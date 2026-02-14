# System Patterns

- **Offline-first write path**: cache locale e coda mutazioni in IndexedDB.
- **Sync asincrono**: flush quando online + autenticato con retry incrementale.
- **Backend security-first**: Supabase con RLS su tutte le tabelle utente.
- **Incremental vertical slices**: schema + client + guard + backup minimale.
