# System Patterns — Architecture, Data Model, and Sync

## High-Level Architecture
- **Client (Next.js PWA)**
  - App Router + TypeScript
  - Service worker for shell/offline assets
  - IndexedDB (Dexie) for local domain store and sync queue
- **Cloud (Supabase)**
  - Postgres as backup/source for cross-device restore
  - Supabase Auth (Google OAuth)
  - RLS policies on all user data tables
- **Deployment**
  - Vercel hosting for frontend
  - Supabase managed backend

## Architectural Pattern
- **Offline-first Local-First Writes**
  1. UI action writes to IndexedDB immediately.
  2. Write appends to local `sync_queue`.
  3. Background sync worker pushes queued changes when online/authenticated.
  4. Server ack updates local `sync_state`.

## Conflict Strategy
- Default: Last-write-wins using `client_updated_at` + `updated_at`.
- Store server snapshot for conflicted rows in `conflict_log`.
- Never block local logging due to conflict.

## Proposed Data Model (Supabase/Postgres)

### Shared fields (most tables)
- `id uuid pk`
- `user_id uuid not null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`
- `client_updated_at timestamptz`
- `deleted_at timestamptz null` (soft delete)

### Tables
1. `profiles`
   - `id uuid pk` (references auth user)
   - `display_name text`
   - `locale text default 'it-IT'`

2. `exercises`
   - `name text`
   - `muscle_groups text[]`
   - `equipment text[]`
   - `is_custom boolean default true`

3. `routines`
   - `name text`
   - `description text`
   - `is_template boolean default true`

4. `routine_exercises`
   - `routine_id uuid`
   - `exercise_id uuid`
   - `sort_order int`
   - `default_sets int`
   - `default_reps text` (range syntax like `6-8`)
   - `default_rest_seconds int`

5. `program_blocks`
   - `name text`
   - `start_date date`
   - `end_date date`
   - `notes text`

6. `progression_rows`
   - `program_block_id uuid`
   - `week_index int`
   - `day_index int`
   - `exercise_id uuid`
   - `planned_sets int`
   - `planned_reps text`
   - `planned_load numeric`
   - `planned_rpe numeric`

7. `workout_sessions`
   - `started_at timestamptz`
   - `ended_at timestamptz`
   - `routine_id uuid null`
   - `program_block_id uuid null`
   - `session_notes text`

8. `exercise_instances`
   - `session_id uuid`
   - `exercise_id uuid`
   - `source_progression_row_id uuid null`
   - `sort_order int`

9. `sets`
   - `exercise_instance_id uuid`
   - `set_index int`
   - `set_type text` (warmup, normal, drop, amrap, failure)
   - `planned_reps text null`
   - `planned_load numeric null`
   - `done_reps int null`
   - `done_load numeric null`
   - `done_rpe numeric null`
   - `done_rir numeric null`
   - `completed_at timestamptz null`

10. `personal_records`
   - `exercise_id uuid`
   - `pr_type text` (e1rm, max_load, max_reps)
   - `value numeric`
   - `achieved_at timestamptz`
   - `source_set_id uuid`

11. `import_jobs`
   - `format text` (csv/json)
   - `status text` (pending/success/failed)
   - `summary jsonb`

12. `export_jobs`
   - `format text` (csv/json)
   - `status text`
   - `file_ref text`

13. `sync_queue` (local + optional mirror)
   - `entity text`
   - `entity_id uuid`
   - `operation text` (upsert/delete)
   - `payload jsonb`
   - `attempts int`
   - `last_error text`

## RLS Pattern (All User Tables)
- Enable RLS on every table.
- Policy template:
  - `SELECT USING (user_id = auth.uid())`
  - `INSERT WITH CHECK (user_id = auth.uid())`
  - `UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`
  - `DELETE USING (user_id = auth.uid())`
- `profiles.id` maps to `auth.uid()` and is self-readable/writable only.

## PWA Pattern
- Cache static app shell + critical routes.
- Network-first for sync APIs, cache-first for shell/assets.
- Show connection/sync badge states: `Offline`, `In sync`, `Sync in coda`.

## Import/Export Pattern
- CSV import parser with explicit mapping per entity.
- Dry-run validation before commit.
- JSON export contains full graph + metadata version.
- Include schema version in all exported payloads.

## Observability Baseline
- Client event logs for sync attempts and failures.
- Lightweight analytics: session duration, total volume, exercise frequency.
