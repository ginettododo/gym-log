# Active Context

## Focus attuale

Consegna baseline tecnica (Task #1): scaffold Next.js, PWA, auth Supabase, schema SQL con RLS, storage offline e backup manuale.

## Decisioni

- Service worker custom minimale per controllare app shell offline.
- Dexie per IndexedDB (draft + sync queue).
- Route `/app` protetta via middleware + sessione Supabase.
