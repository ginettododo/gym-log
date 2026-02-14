-- 0001_initial.sql
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  display_name text,
  avatar_url text
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  muscle_groups text[] not null default '{}',
  equipment text not null default '',
  created_at timestamptz not null default now(),
  client_updated_at timestamptz not null default now()
);

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  client_updated_at timestamptz not null default now()
);

create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine_id uuid not null references public.routines (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  sort int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  client_updated_at timestamptz not null default now(),
  unique (routine_id, exercise_id, sort)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  client_updated_at timestamptz not null default now()
);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  sort int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  client_updated_at timestamptz not null default now(),
  unique (session_id, exercise_id, sort)
);

create table if not exists public.set_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  set_type text not null,
  weight numeric,
  reps int,
  rpe numeric,
  rir int,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  client_updated_at timestamptz not null default now()
);

create table if not exists public.program_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  client_updated_at timestamptz not null default now()
);

create table if not exists public.progression_rows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  program_block_id uuid not null references public.program_blocks (id) on delete cascade,
  week int not null,
  day int not null,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  target_sets int not null,
  target_reps text not null,
  target_load numeric,
  target_rpe numeric,
  notes text,
  created_at timestamptz not null default now(),
  client_updated_at timestamptz not null default now()
);

create table if not exists public.backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.set_entries enable row level security;
alter table public.program_blocks enable row level security;
alter table public.progression_rows enable row level security;
alter table public.backups enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_delete_own" on public.profiles for delete to authenticated using (id = auth.uid());

create policy "exercises_crud_own" on public.exercises for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "routines_crud_own" on public.routines for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "workout_sessions_crud_own" on public.workout_sessions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "program_blocks_crud_own" on public.program_blocks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "progression_rows_crud_own" on public.progression_rows for all to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.program_blocks pb where pb.id = progression_rows.program_block_id and pb.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.program_blocks pb where pb.id = progression_rows.program_block_id and pb.user_id = auth.uid()
  )
);

create policy "backups_crud_own" on public.backups for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "routine_exercises_crud_own" on public.routine_exercises for all to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.routines r where r.id = routine_exercises.routine_id and r.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.routines r where r.id = routine_exercises.routine_id and r.user_id = auth.uid()
  )
);

create policy "workout_exercises_crud_own" on public.workout_exercises for all to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.workout_sessions ws where ws.id = workout_exercises.session_id and ws.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.workout_sessions ws where ws.id = workout_exercises.session_id and ws.user_id = auth.uid()
  )
);

create policy "set_entries_crud_own" on public.set_entries for all to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.workout_exercises we
    join public.workout_sessions ws on ws.id = we.session_id
    where we.id = set_entries.workout_exercise_id and ws.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.workout_exercises we
    join public.workout_sessions ws on ws.id = we.session_id
    where we.id = set_entries.workout_exercise_id and ws.user_id = auth.uid()
  )
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
