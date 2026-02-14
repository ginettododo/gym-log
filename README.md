# Gym Log Offline (Baseline Tecnica)

Baseline offline-first per un workout tracker solo utente con Next.js + Supabase.

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase Auth (Google OAuth) + Postgres (RLS)
- IndexedDB (Dexie) per cache locale e coda sync
- PWA installabile con app shell offline

## Scelte PWA

È stato usato un **service worker custom** (`public/sw.js`) invece di plugin complessi, perché in questa fase serve una baseline semplice e auditabile:

- cache shell minima (`/`, `/login`, manifest)
- fallback offline per richieste di navigazione
- caching progressivo per risorse GET

Questa scelta è "boring" e adatta ad avviare rapidamente test offline-first.

## Prerequisiti

- Node.js 20+
- npm 10+
- Progetto Supabase attivo

## Variabili ambiente

Copia `.env.example` in `.env.local`:

```bash
cp .env.example .env.local
```

Valori richiesti:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Setup Supabase

1. Crea un nuovo progetto Supabase.
2. In **Authentication > Providers > Google**, abilita Google.
3. Configura redirect URL OAuth:
   - Locale: `http://localhost:3000/auth/callback`
   - Produzione (Vercel): `https://<tuo-dominio>/auth/callback`
4. Esegui la migrazione SQL da `db/migrations/0001_initial.sql` nel SQL editor Supabase.

## Avvio locale

```bash
npm install
npm run dev
```

Apri `http://localhost:3000`.

## Deploy Vercel

1. Importa il repo in Vercel.
2. Aggiungi in **Project Settings > Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy.
4. Aggiorna in Supabase i redirect URL Google con il dominio Vercel definitivo.

## Check rapidi

- Login Google funzionante e redirect a `/app`
- `/app` protetta (utente anonimo -> `/login`)
- `/app/settings` mostra bottone **Backup ora**
- Modalità offline: app shell raggiungibile dopo una prima visita online

## Sicurezza

- Nessun segreto server-side committato.
- RLS abilitata su tutte le tabelle utente.
- Policy ownership basate su `auth.uid()` e `EXISTS` per join tables.
