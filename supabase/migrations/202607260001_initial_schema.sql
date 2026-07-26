create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'America/Guayaquil',
  purpose text,
  coins integer not null default 0 check (coins >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.life_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  icon text,
  color text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  semester integer,
  status text not null default 'pending'
    check (status in ('pending', 'studying', 'passed', 'failed')),
  final_grade numeric(5,2),
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  area_id uuid references public.life_areas(id) on delete set null,
  title text not null,
  description text,
  task_type text not null default 'task'
    check (task_type in ('task', 'mission', 'project', 'appointment')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  due_at timestamptz,
  estimated_minutes integer check (estimated_minutes > 0),
  completed_at timestamptz,
  xp_reward integer not null default 0 check (xp_reward >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  evaluation_type text not null default 'exam'
    check (evaluation_type in ('exam', 'quiz', 'assignment', 'presentation', 'project')),
  evaluation_at timestamptz not null,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'preparing', 'completed', 'cancelled')),
  grade numeric(5,2),
  maximum_grade numeric(5,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid references public.life_areas(id) on delete set null,
  name text not null,
  level integer not null default 1 check (level >= 1),
  current_xp integer not null default 0 check (current_xp >= 0),
  next_level_xp integer not null default 100 check (next_level_xp > 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.skill_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  description text not null,
  xp_awarded integer not null default 0,
  evidence_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid references public.life_areas(id) on delete set null,
  title text not null,
  reason text,
  current_value numeric,
  target_value numeric,
  unit text,
  target_date date,
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid references public.life_areas(id) on delete set null,
  title text not null,
  habit_type text not null default 'habit'
    check (habit_type in ('habit', 'non_negotiable')),
  frequency jsonb not null default '{"type":"daily"}'::jsonb,
  target_amount numeric not null default 1,
  unit text not null default 'vez',
  active boolean not null default true,
  xp_reward integer not null default 0 check (xp_reward >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  log_date date not null default current_date,
  amount numeric not null default 1,
  completed boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  evaluation_id uuid references public.evaluations(id) on delete set null,
  started_at timestamptz not null default now(),
  duration_minutes integer not null check (duration_minutes > 0),
  study_mode text not null default 'practice'
    check (study_mode in ('reading', 'guided', 'practice', 'independent', 'simulation')),
  comprehension smallint check (comprehension between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_on date not null default current_date,
  weight_kg numeric(5,2),
  body_fat_percent numeric(5,2),
  waist_cm numeric(5,2),
  energy_level smallint check (energy_level between 1 and 5),
  sleep_hours numeric(4,2),
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, recorded_on)
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  start_date date not null,
  end_date date not null,
  status text not null default 'active'
    check (status in ('planned', 'active', 'completed')),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_type text not null
    check (review_type in ('daily', 'weekly', 'monthly')),
  review_date date not null default current_date,
  victories text,
  difficulties text,
  lessons text,
  next_adjustment text,
  mood smallint check (mood between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, review_type, review_date)
);

create table if not exists public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  amount integer not null check (amount <> 0),
  reason text not null,
  source_type text,
  source_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  coin_cost integer not null check (coin_cost >= 0),
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'subjects', 'tasks', 'evaluations',
    'skills', 'goals', 'habits'
  ]
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I',
      table_name
    );
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()',
      table_name
    );
  end loop;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      'Andre'
    )
  )
  on conflict (user_id) do nothing;

  insert into public.life_areas
    (user_id, name, slug, color, sort_order)
  values
    (new.id, 'Disciplina', 'disciplina', '#8B7CF6', 1),
    (new.id, 'Estado físico', 'fisico', '#5E8FD3', 2),
    (new.id, 'Enfoque mental', 'mente', '#9B87C9', 3),
    (new.id, 'Carrera', 'carrera', '#D1A85A', 4),
    (new.id, 'Finanzas', 'finanzas', '#6D9B8C', 5),
    (new.id, 'Relaciones', 'relaciones', '#B98293', 6),
    (new.id, 'Equilibrio personal', 'equilibrio', '#78889B', 7),
    (new.id, 'Creatividad', 'creatividad', '#A78C6A', 8)
  on conflict (user_id, slug) do nothing;

  insert into public.seasons
    (user_id, name, description, start_date, end_date)
  values (
    new.id,
    'Temporada 1',
    'Construir disciplina, avanzar en Ciencia de Datos y mejorar la salud.',
    current_date,
    current_date + 55
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'life_areas', 'subjects', 'tasks', 'evaluations',
    'skills', 'skill_evidence', 'goals', 'habits', 'habit_logs',
    'study_sessions', 'body_measurements', 'seasons', 'reviews',
    'xp_transactions', 'rewards'
  ]
  loop
    execute format(
      'alter table public.%I enable row level security',
      table_name
    );
    execute format(
      'drop policy if exists own_rows on public.%I',
      table_name
    );
    execute format(
      'create policy own_rows on public.%I
       for all to authenticated
       using ((select auth.uid()) = user_id)
       with check ((select auth.uid()) = user_id)',
      table_name
    );
  end loop;
end $$;

grant usage on schema public to authenticated;
grant select, insert, update, delete
on all tables in schema public
to authenticated;
grant usage, select
on all sequences in schema public
to authenticated;
