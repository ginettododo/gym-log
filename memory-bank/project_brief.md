# Project Brief — Gym Log (Solo Workout Tracker)

## Vision
Build a **mobile-first, installable PWA** for a single user to quickly log workouts in the gym, even with unstable or no connectivity. The app must feel like a native app: fast launch, reliable local data, and frictionless session logging.

## Core Problem
Existing workout apps are either:
- Too complex and coach-like (algorithmic suggestions the user does not want), or
- Too simplistic and unreliable offline.

This project focuses on **high-speed manual logging** with structured training plans imported from CSV/Sheets, plus secure cloud backup.

## Target User
- Single owner/operator (the same person who uses the app)
- Intermediate/advanced lifter with recurring programs
- Wants control over templates/progression tables
- Needs trustworthy historical data and quick gym interactions

## Product Goals (MVP)
1. Start a workout in **<10 seconds**.
2. Log sets with one hand and minimal taps.
3. Work completely offline with local-first writes.
4. Sync/backup to Supabase when online.
5. Google login and private-by-default data access.
6. Import existing routines/programs from CSV; export complete backups in CSV/JSON.

## Non-Goals (MVP)
- No algorithmic coaching/recommendation engine.
- No social features, sharing feeds, or public profiles.
- No multi-user collaboration.
- No wearable integrations.

## Success Metrics
- Time to first logged set after opening app: **<30s** (target median).
- Start workout action completion: **<10s**.
- Offline write success rate: **100%** (writes never blocked by network).
- Sync conflict unresolved rate: **<1%** of synced objects.
- Session completion without page refresh/crash: **>99%**.

## Platform and Stack Constraints
- Frontend: Next.js + TypeScript
- App model: PWA installable, mobile-first UX
- Local persistence: IndexedDB (Dexie) with local-first write queue
- Backend: Supabase (Postgres + Auth + RLS)
- Auth: Google OAuth via Supabase
- Hosting: Vercel
- Source control: GitHub

## Security & Privacy Principles
- Every table protected by RLS.
- All rows scoped by `user_id = auth.uid()`.
- No anonymous data access in production.
- Backup transport over TLS only.
- Export/import files treated as sensitive user data.

## Release Strategy
- Phase 1 (MVP): Auth + schema + offline baseline + workout logging core + import/export.
- Phase 2: richer analytics, UX polish, robust conflict tooling, deeper PWA behaviors.
