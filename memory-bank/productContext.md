# Product Context — UX, Jobs-To-Be-Done, and Constraints

## Primary Job To Be Done
"When I’m training, I want to open the app and log my planned sets quickly, so I can stay focused on lifting instead of using my phone."

## Top UX Principles
1. **Start workout in <10 seconds**
   - One primary CTA on home screen: `Inizia allenamento`.
   - Resume last active template/session instantly.
2. **Prefill last time**
   - For each exercise/set, prefill previous performance (weight/reps/RPE/RIR).
   - Planned values shown side-by-side with done values.
3. **Rest timer auto**
   - Auto-start rest timer when a set is marked done.
   - Quick restart/extend controls (`+30s`, `+60s`).
4. **Fast in-gym interactions**
   - One-hand reachable controls, large tap targets.
   - Numeric keypad-optimized inputs.
   - Low text density while logging.

## UX Language Policy
- **User-facing UI copy in Italian**.
- Developer docs, schema docs, and architecture docs in English.

## Core User Flows
1. Login with Google → first-time setup.
2. Import exercises/routines/program blocks (CSV).
3. Start workout from routine/program day.
4. Log sets quickly with prefilled defaults.
5. Auto rest timer between sets.
6. Finish session and sync when online.
7. Review recent PRs/trends.
8. Export full backup (JSON/CSV).

## Data Reliability Expectations
- Local-first writes must always succeed when device storage is available.
- Sync is asynchronous and retriable.
- If Supabase is unavailable, app remains fully functional for logging.
- Every synced record includes audit fields (`updated_at`, `client_updated_at`, `sync_status`).

## Product Risks and Mitigations
- **Risk: Offline conflicts**
  - Mitigation: deterministic last-write-wins + conflict log for review.
- **Risk: Slow form UX in gym**
  - Mitigation: aggressive defaults, sticky inputs, reduced navigation depth.
- **Risk: Data loss on device-only mode**
  - Mitigation: visible backup status + export reminders.
- **Risk: Security complacency in solo app**
  - Mitigation: strict RLS and no bypass shortcuts.

## Key Entities (Product View)
- Exercise library
- Routines/Templates
- Program Blocks + progression rows (planned values)
- Workout Sessions
- Exercise Instances within sessions
- Set logs (done values + metadata)
- PR records
- Sync events + import/export artifacts

## Accessibility/Usability Baseline
- Minimum 44px touch targets.
- Sufficient contrast for gym lighting conditions.
- Haptics optional (future), but visual completion feedback mandatory.
- Works in portrait mode first.
