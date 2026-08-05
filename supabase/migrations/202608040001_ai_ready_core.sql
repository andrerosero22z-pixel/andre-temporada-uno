-- Andre: Temporada Uno
-- Migración V2: núcleo estructurado y preparado para futuras acciones MCP/IA.
-- Es aditiva: no elimina tablas ni datos existentes.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Áreas y claves estables
-- ---------------------------------------------------------------------------

insert into public.life_areas (user_id, name, slug, color, sort_order)
select user_id, 'Nutrición', 'nutricion', '#72A891', 3
from public.profiles
on conflict (user_id, slug) do update
set name = excluded.name,
    color = excluded.color,
    sort_order = excluded.sort_order;

update public.life_areas
set sort_order = case slug
  when 'disciplina' then 1
  when 'fisico' then 2
  when 'nutricion' then 3
  when 'mente' then 4
  when 'carrera' then 5
  when 'finanzas' then 6
  when 'relaciones' then 7
  when 'equilibrio' then 8
  when 'creatividad' then 9
  else sort_order
end;

alter table public.habits
  add column if not exists system_key text,
  add column if not exists created_via text not null default 'web';

-- Las claves de sistema permiten que la web y la IA encuentren hábitos
-- fundamentales sin depender del texto visible o del idioma.
with ranked as (
  select
    id,
    title,
    row_number() over (partition by user_id, title order by created_at, id) as position
  from public.habits
  where title in (
    'Oración', 'Higiene básica', 'Movimiento', 'Planificar el día',
    'Dormir a tiempo', 'Tiempo total de celular', 'Redes sociales',
    'Videos cortos', 'Videojuegos', 'Ocio intencional', 'Ayuno de estímulos'
  )
)
update public.habits as habit
set system_key = case ranked.title
  when 'Oración' then 'prayer'
  when 'Higiene básica' then 'hygiene'
  when 'Movimiento' then 'movement'
  when 'Planificar el día' then 'daily_planning'
  when 'Dormir a tiempo' then 'sleep_on_time'
  when 'Tiempo total de celular' then 'screen_time'
  when 'Redes sociales' then 'social_media'
  when 'Videos cortos' then 'short_video'
  when 'Videojuegos' then 'gaming'
  when 'Ocio intencional' then 'intentional_leisure'
  when 'Ayuno de estímulos' then 'stimulation_fast'
end
from ranked
where habit.id = ranked.id
  and ranked.position = 1
  and habit.system_key is null;

create unique index if not exists habits_user_system_key_uidx
  on public.habits (user_id, system_key)
  where system_key is not null;

-- Clasificación inicial de hábitos existentes. Los personalizados se pueden
-- relacionar con un área desde la web después de esta migración.
update public.habits as habit
set area_id = area.id
from public.life_areas as area
where habit.user_id = area.user_id
  and area.slug = 'nutricion'
  and habit.area_id is null
  and habit.title ~* '(aliment|nutric|comida|agua|proteína|fruta|verdura)';

update public.habits as habit
set area_id = area.id
from public.life_areas as area
where habit.user_id = area.user_id
  and habit.area_id is null
  and (
    (area.slug = 'disciplina' and habit.system_key = 'daily_planning') or
    (area.slug = 'equilibrio' and habit.system_key = 'prayer') or
    (area.slug = 'fisico' and habit.system_key in ('hygiene', 'movement', 'sleep_on_time')) or
    (area.slug = 'mente' and habit.system_key in (
      'screen_time', 'social_media', 'short_video', 'gaming',
      'intentional_leisure', 'stimulation_fast'
    ))
  );

-- ---------------------------------------------------------------------------
-- 2. Relaciones que faltaban en tareas y evaluaciones
-- ---------------------------------------------------------------------------

alter table public.tasks
  add column if not exists goal_id uuid references public.goals(id) on delete set null,
  add column if not exists season_id uuid references public.seasons(id) on delete set null,
  add column if not exists parent_task_id uuid references public.tasks(id) on delete set null,
  add column if not exists scheduled_for date,
  add column if not exists created_via text not null default 'web',
  add column if not exists idempotency_key text;

alter table public.evaluations
  add column if not exists goal_id uuid references public.goals(id) on delete set null,
  add column if not exists season_id uuid references public.seasons(id) on delete set null,
  add column if not exists date_confidence text not null default 'confirmed',
  add column if not exists created_via text not null default 'web',
  add column if not exists idempotency_key text;

create unique index if not exists tasks_user_idempotency_uidx
  on public.tasks (user_id, idempotency_key)
  where idempotency_key is not null;

create unique index if not exists evaluations_user_idempotency_uidx
  on public.evaluations (user_id, idempotency_key)
  where idempotency_key is not null;

-- ---------------------------------------------------------------------------
-- 3. Diario real: varias entradas por día sin sobrescritura
-- ---------------------------------------------------------------------------

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  entry_type text not null default 'reflection'
    check (entry_type in ('reflection', 'victory', 'obstacle', 'decision', 'free')),
  content text not null check (length(btrim(content)) > 0),
  mood smallint check (mood between 1 and 5),
  created_via text not null default 'web',
  legacy_review_id uuid unique references public.reviews(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.journal_entries
  (user_id, entry_date, entry_type, content, mood, created_via, legacy_review_id, created_at)
select
  user_id,
  review_date,
  'reflection',
  lessons,
  mood,
  'migration',
  id,
  created_at
from public.reviews
where lessons is not null
  and length(btrim(lessons)) > 0
on conflict (legacy_review_id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Metas con checkpoints e historial de progreso
-- ---------------------------------------------------------------------------

create table if not exists public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  target_value numeric,
  unit text,
  due_date date,
  sort_order integer not null default 0,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'completed', 'skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_progress_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  value numeric not null,
  unit text,
  note text,
  recorded_on date not null default current_date,
  created_via text not null default 'web',
  created_at timestamptz not null default now()
);

-- Conserva una primera línea base para metas que ya tienen valor actual.
insert into public.goal_progress_logs
  (user_id, goal_id, value, unit, note, recorded_on, created_via)
select
  goal.user_id,
  goal.id,
  goal.current_value,
  goal.unit,
  'Línea base migrada',
  goal.created_at::date,
  'migration'
from public.goals as goal
where goal.current_value is not null
  and not exists (
    select 1
    from public.goal_progress_logs as progress
    where progress.goal_id = goal.id
      and progress.note = 'Línea base migrada'
  );

-- ---------------------------------------------------------------------------
-- 5. Preparación académica persistente
-- ---------------------------------------------------------------------------

create table if not exists public.evaluation_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  title text not null,
  importance smallint check (importance between 1 and 5),
  mastery smallint not null default 0 check (mastery between 0 and 5),
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (evaluation_id, title)
);

create table if not exists public.evaluation_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  topic_id uuid references public.evaluation_topics(id) on delete cascade,
  phase text not null
    check (phase in (
      'diagnosis', 'understanding', 'guided_practice',
      'independent_practice', 'micro_simulation', 'full_simulation', 'correction'
    )),
  title text not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'completed', 'skipped')),
  scheduled_for date,
  estimated_minutes integer check (estimated_minutes > 0),
  completed_at timestamptz,
  result_note text,
  sort_order integer not null default 0,
  created_via text not null default 'web',
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists evaluation_steps_user_idempotency_uidx
  on public.evaluation_steps (user_id, idempotency_key)
  where idempotency_key is not null;

alter table public.study_sessions
  add column if not exists topic_id uuid references public.evaluation_topics(id) on delete set null,
  add column if not exists step_id uuid references public.evaluation_steps(id) on delete set null,
  add column if not exists autonomy smallint check (autonomy between 1 and 5),
  add column if not exists outcome text,
  add column if not exists created_via text not null default 'web';

-- ---------------------------------------------------------------------------
-- 6. Plan diario que la IA podrá consultar y reorganizar
-- ---------------------------------------------------------------------------

create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null default current_date,
  mode text not null default 'normal'
    check (mode in ('normal', 'exam', 'recovery', 'rest')),
  main_focus text,
  available_minutes integer check (available_minutes >= 0),
  notes text,
  accepted_at timestamptz,
  closed_at timestamptz,
  created_via text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create table if not exists public.daily_plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.daily_plans(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  evaluation_step_id uuid references public.evaluation_steps(id) on delete set null,
  habit_id uuid references public.habits(id) on delete set null,
  item_type text not null default 'custom'
    check (item_type in ('task', 'evaluation_step', 'habit', 'custom')),
  title text not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'completed', 'skipped', 'moved')),
  planned_minutes integer check (planned_minutes > 0),
  sort_order integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 7. Recursos y evidencia enlazable (libros, enlaces, chats, archivos)
-- ---------------------------------------------------------------------------

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  evaluation_id uuid references public.evaluations(id) on delete set null,
  goal_id uuid references public.goals(id) on delete set null,
  title text not null,
  resource_type text not null default 'link'
    check (resource_type in ('link', 'note', 'book', 'file', 'chat')),
  url text,
  notes text,
  created_via text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 8. Auditoría e idempotencia para acciones web/MCP/IA
-- ---------------------------------------------------------------------------

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  source text not null default 'web'
    check (source in ('web', 'mcp', 'system', 'import', 'migration')),
  request_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists activity_events_user_request_uidx
  on public.activity_events (user_id, request_id)
  where request_id is not null;

-- ---------------------------------------------------------------------------
-- 9. updated_at, índices, RLS y permisos
-- ---------------------------------------------------------------------------

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'journal_entries', 'goal_milestones', 'evaluation_topics',
    'evaluation_steps', 'daily_plans', 'daily_plan_items', 'resources'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()',
      table_name
    );
  end loop;
end $$;

create index if not exists tasks_user_status_due_idx
  on public.tasks (user_id, status, due_at);
create index if not exists tasks_user_scheduled_idx
  on public.tasks (user_id, scheduled_for);
create index if not exists evaluations_user_status_date_idx
  on public.evaluations (user_id, status, evaluation_at);
create index if not exists habits_user_area_active_idx
  on public.habits (user_id, area_id, active);
create index if not exists habit_logs_user_date_idx
  on public.habit_logs (user_id, log_date desc);
create index if not exists study_sessions_user_started_idx
  on public.study_sessions (user_id, started_at desc);
create index if not exists journal_entries_user_date_idx
  on public.journal_entries (user_id, entry_date desc, created_at desc);
create index if not exists goal_progress_goal_date_idx
  on public.goal_progress_logs (goal_id, recorded_on desc);
create index if not exists evaluation_steps_eval_status_idx
  on public.evaluation_steps (evaluation_id, status, scheduled_for);
create index if not exists daily_plan_items_plan_order_idx
  on public.daily_plan_items (plan_id, sort_order);
create index if not exists resources_user_type_idx
  on public.resources (user_id, resource_type, created_at desc);
create index if not exists activity_events_user_created_idx
  on public.activity_events (user_id, created_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'journal_entries', 'goal_milestones', 'goal_progress_logs',
    'evaluation_topics', 'evaluation_steps', 'daily_plans',
    'daily_plan_items', 'resources'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists own_rows on public.%I', table_name);
    execute format(
      'create policy own_rows on public.%I
       for all to authenticated
       using ((select auth.uid()) = user_id)
       with check ((select auth.uid()) = user_id)',
      table_name
    );
  end loop;
end $$;

alter table public.activity_events enable row level security;
drop policy if exists own_activity_events_read on public.activity_events;
drop policy if exists own_activity_events_insert on public.activity_events;

create policy own_activity_events_read on public.activity_events
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy own_activity_events_insert on public.activity_events
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete
on public.journal_entries,
   public.goal_milestones,
   public.goal_progress_logs,
   public.evaluation_topics,
   public.evaluation_steps,
   public.daily_plans,
   public.daily_plan_items,
   public.resources
to authenticated;

grant select, insert
on public.activity_events
to authenticated;

-- Actualiza el alta de usuarios futuros para incluir Nutrición.
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
    (new.id, 'Nutrición', 'nutricion', '#72A891', 3),
    (new.id, 'Enfoque mental', 'mente', '#9B87C9', 4),
    (new.id, 'Carrera', 'carrera', '#D1A85A', 5),
    (new.id, 'Finanzas', 'finanzas', '#6D9B8C', 6),
    (new.id, 'Relaciones', 'relaciones', '#B98293', 7),
    (new.id, 'Equilibrio personal', 'equilibrio', '#78889B', 8),
    (new.id, 'Creatividad', 'creatividad', '#A78C6A', 9)
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

-- Fin de la migración V2.
