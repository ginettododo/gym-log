# AGENTS.md — Working Agreement for This Repository

## Mission
Build and maintain a **solo-user, offline-first workout tracker** with strong security defaults and extremely fast workout logging UX.

## Product/Technical North Star
- Mobile-first PWA that feels app-like.
- Local-first writes: never block logging on network.
- Supabase only as secure auth + backup/sync backend.
- Keep implementation simple, testable, and incremental.

## Stack Defaults
- Next.js (App Router) + TypeScript
- Supabase (Auth + Postgres + RLS)
- IndexedDB via Dexie for local persistence
- Vercel deployment

## Non-Negotiable Rules
1. **RLS everywhere** on user data tables.
2. Every user-owned record must include `user_id`.
3. Policies must enforce `user_id = auth.uid()` for CRUD.
4. No feature should require constant connectivity to log workouts.
5. UI copy exposed to end user must be in Italian.

## Performance/UX Constraints
- Start workout path optimized for <10 seconds.
- One-hand-friendly controls, large tap targets.
- Prefill prior values to reduce data entry effort.
- Auto rest timer after set completion.

## File/Folder Intent (Recommended)
- `memory-bank/`: architecture and planning docs.
- `app/`: Next.js routes and UI surfaces.
- `components/`: reusable UI components.
- `lib/`: clients, domain logic, sync services.
- `db/`: SQL migrations and policies.
- `public/`: PWA manifest, icons, static assets.
- `tests/`: unit/integration/e2e tests.

## Coding Guidance
- Prefer small composable modules over monolith files.
- Keep side effects (network, storage) isolated behind service/repository layers.
- Use explicit types in domain and sync logic.
- Add acceptance-driven tests when adding core flows.

## Data Safety Guidance
- Use soft deletes for user records where practical.
- Include `client_updated_at` for sync conflict handling.
- Maintain migration-based schema history under versioned SQL files.
- Ensure import/export formats include schema version metadata.

## Delivery Guidance
- Ship vertical slices: schema + local model + UI + tests for each feature.
- Avoid premature abstractions; optimize for maintainability and reliability.
- When uncertain, prioritize data integrity over UI polish.
