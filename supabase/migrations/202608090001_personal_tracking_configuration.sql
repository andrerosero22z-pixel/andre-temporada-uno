-- Andre: Temporada Uno
-- Generic, additive support for structured routines and observation plans.

alter table public.habits
  add column if not exists description text,
  add column if not exists difficult_day_version text,
  add column if not exists is_optional boolean not null default false;

alter table public.body_measurements
  add column if not exists height_cm numeric(5,2)
    check (height_cm is null or height_cm between 50 and 260),
  add column if not exists measurement_context text;

create table if not exists public.tracking_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area text not null check (area in ('nutrition', 'attention', 'physical', 'study', 'general')),
  title text not null,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'paused', 'completed')),
  start_date date,
  end_date date,
  instructions jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, title),
  check (end_date is null or start_date is null or end_date >= start_date)
);

drop trigger if exists set_updated_at on public.tracking_plans;
create trigger set_updated_at
before update on public.tracking_plans
for each row execute function public.set_updated_at();

alter table public.tracking_plans enable row level security;

drop policy if exists own_rows on public.tracking_plans;
create policy own_rows on public.tracking_plans
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.tracking_plans to authenticated;

create index if not exists tracking_plans_user_area_status_idx
  on public.tracking_plans (user_id, area, status, start_date);
