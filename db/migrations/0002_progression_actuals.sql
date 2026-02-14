-- 0002_progression_actuals.sql
create table if not exists public.progression_actuals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  progression_row_id uuid not null references public.progression_rows (id) on delete cascade,
  date timestamptz not null,
  actual_weight numeric,
  actual_reps int,
  actual_rpe numeric,
  notes text,
  created_at timestamptz not null default now(),
  client_updated_at timestamptz not null default now()
);

alter table public.progression_actuals enable row level security;

create policy "progression_actuals_crud_own" on public.progression_actuals for all to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.progression_rows pr
    where pr.id = progression_actuals.progression_row_id
      and pr.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.progression_rows pr
    where pr.id = progression_actuals.progression_row_id
      and pr.user_id = auth.uid()
  )
);
