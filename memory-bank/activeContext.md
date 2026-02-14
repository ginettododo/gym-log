# Active Context — Current Session

## Current Goal
**Scaffold + Auth + DB schema + offline storage baseline**

## Why This Goal Now
This is the highest-leverage foundation for the whole app:
- App shell and navigation must exist before feature iteration.
- Auth and RLS are mandatory for secure backup.
- DB schema must stabilize early to avoid migration churn.
- Offline storage baseline is critical to the core promise.

## In-Scope (This Session)
1. Scaffold Next.js TypeScript app structure for PWA direction.
2. Configure Supabase client and Google OAuth flow skeleton.
3. Draft initial SQL schema + RLS policy scripts.
4. Establish IndexedDB (Dexie) domain stores + sync queue store.
5. Define shared types for core entities.
6. Document sync lifecycle and error handling states.

## Out-of-Scope (This Session)
- Full workout UI implementation.
- Advanced analytics dashboards.
- Complete CSV import wizard UX.
- Push notifications/background periodic sync tuning.

## Key Decisions Locked
- Local-first writes are non-negotiable.
- Supabase is backup/auth layer, not single point of write dependency.
- All user data tables include `user_id` and strict RLS.
- Italian copy for UI strings from first usable screens.

## Open Questions
- Exact conflict-resolution UX surface (silent vs explicit review screen).
- Whether to mirror `sync_queue` server-side for debugging/audit.
- Preferred schema for progression table import format variations.

## Immediate Next Actions
1. Create SQL migration `0001_initial_schema.sql` with all core tables.
2. Add `0002_rls_policies.sql` with policy templates per table.
3. Implement `lib/db/dexie.ts` + local repositories.
4. Implement auth boundary components and session provider.
5. Add first route shells: login, dashboard, active workout.
