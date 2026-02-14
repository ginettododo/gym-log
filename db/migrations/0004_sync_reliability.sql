-- 0004_sync_reliability.sql

alter table public.workout_sessions
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists version int not null default 1;

alter table public.workout_exercises
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists version int not null default 1;

alter table public.set_entries
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists version int not null default 1;

alter table public.program_blocks
  add column if not exists version int not null default 1;

alter table public.progression_rows
  add column if not exists version int not null default 1;

alter table public.progression_actuals
  add column if not exists version int not null default 1;

create table if not exists public.sync_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  idempotency_key text not null,
  table_name text not null,
  operation text not null,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

alter table public.sync_idempotency_keys enable row level security;

create policy "sync_idempotency_keys_crud_own" on public.sync_idempotency_keys
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
