# Progress Plan — Atomic, Testable Tasks

## Status Legend
- `TODO`
- `IN_PROGRESS`
- `DONE`

## Epic A — Project Scaffold & Quality Baseline

### A1. Initialize Next.js + TypeScript + App Router + ESLint/Prettier
- Status: `TODO`
- Acceptance Criteria:
  - `npm run dev` starts without errors.
  - TypeScript strict mode enabled.
  - Lint command passes on clean scaffold.

### A2. Configure PWA basics (manifest + service worker registration)
- Status: `TODO`
- Acceptance Criteria:
  - App install prompt available on supported mobile browsers.
  - Manifest includes name, icons, theme/background colors.
  - Offline app shell route loads when network is disabled.

### A3. Create app shell layout (mobile-first)
- Status: `TODO`
- Acceptance Criteria:
  - Base layout works at 390x844 viewport without overflow issues.
  - Primary CTA `Inizia allenamento` visible on dashboard.

## Epic B — Auth & Security

### B1. Setup Supabase project + environment wiring
- Status: `TODO`
- Acceptance Criteria:
  - Environment variables documented and loaded in app.
  - Supabase client initializes in browser and server contexts.

### B2. Implement Google OAuth login flow
- Status: `TODO`
- Acceptance Criteria:
  - User can sign in with Google and return to app.
  - Session persists across refresh.
  - Logout clears local session.

### B3. Enforce route protection
- Status: `TODO`
- Acceptance Criteria:
  - Unauthenticated users redirected to `/login`.
  - Authenticated users can access app routes.

### B4. Create RLS policies for all user tables
- Status: `TODO`
- Acceptance Criteria:
  - RLS enabled on every table.
  - SQL tests confirm users cannot read/write other users' rows.

## Epic C — Database & Domain Model

### C1. Create initial schema migration
- Status: `TODO`
- Acceptance Criteria:
  - All core tables exist (exercises, routines, program_blocks, progression_rows, sessions, sets, PRs, import/export).
  - Foreign keys and indexes created for critical relations.

### C2. Add updated_at triggers and soft-delete convention
- Status: `TODO`
- Acceptance Criteria:
  - `updated_at` updates automatically on row changes.
  - Soft-delete path documented and query-safe.

### C3. Define TypeScript domain types
- Status: `TODO`
- Acceptance Criteria:
  - Shared types compile and map to DB columns.
  - No `any` in domain layer.

## Epic D — Offline-First Foundation

### D1. Add Dexie and local schema
- Status: `TODO`
- Acceptance Criteria:
  - IndexedDB stores created for core entities and `sync_queue`.
  - Local CRUD works while offline.

### D2. Implement local-first repository write path
- Status: `TODO`
- Acceptance Criteria:
  - Creating/updating sets writes instantly to local store.
  - Writes are queued for sync with operation metadata.

### D3. Implement sync worker (manual trigger + auto on reconnect)
- Status: `TODO`
- Acceptance Criteria:
  - Pending queue drains successfully when online.
  - Failed items retain error and retry count.

### D4. Add sync status UI indicator
- Status: `TODO`
- Acceptance Criteria:
  - User sees `Offline`, `Sync in coda`, or `Sincronizzato` clearly.

## Epic E — Workout Logging MVP Flow

### E1. Start workout flow in <10 seconds
- Status: `TODO`
- Acceptance Criteria:
  - From dashboard to active session screen in <=2 taps.
  - Median completion time under 10 seconds in manual QA.

### E2. Prefill last session values
- Status: `TODO`
- Acceptance Criteria:
  - For repeated exercise, prior load/reps shown by default.

### E3. Log sets with set type + RPE/RIR optional fields
- Status: `TODO`
- Acceptance Criteria:
  - Set can be completed with reps/load only.
  - Optional RPE/RIR fields do not block save.

### E4. Rest timer auto-start
- Status: `TODO`
- Acceptance Criteria:
  - Completing a set starts countdown automatically.
  - Quick add-time controls function correctly.

## Epic F — Import/Export

### F1. CSV import for exercises/routines/progression rows
- Status: `TODO`
- Acceptance Criteria:
  - Parser validates headers and reports row-level errors.
  - Valid rows persist locally and queue for sync.

### F2. JSON full backup export
- Status: `TODO`
- Acceptance Criteria:
  - Export file contains versioned full dataset.
  - File can be re-imported without schema mismatch.

### F3. CSV export for workout history
- Status: `TODO`
- Acceptance Criteria:
  - Export includes sessions, exercises, sets with timestamps.

## Definition of Done (MVP)
- All MVP epics have acceptance criteria met.
- Manual offline/online toggle tests pass.
- RLS verified with at least two distinct test users.
- Basic Lighthouse PWA checks pass on mobile emulation.
