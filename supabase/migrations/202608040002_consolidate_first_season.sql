-- Andre: Temporada Uno
-- Consolidación de la primera temporada.
-- Migración aditiva: conserva toda la información y no elimina objetos existentes.

-- 1. Configuración inicial y privacidad futura de la IA.
alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists journal_ai_allowed boolean not null default false,
  add column if not exists rules_version text not null default 'draft';

-- Las cuentas que ya contienen actividad real se consideran configuradas.
update public.profiles as profile
set onboarding_completed = true,
    onboarding_completed_at = coalesce(profile.onboarding_completed_at, now())
where profile.onboarding_completed = false
  and (
    exists (select 1 from public.tasks where user_id = profile.user_id) or
    exists (select 1 from public.evaluations where user_id = profile.user_id) or
    exists (select 1 from public.study_sessions where user_id = profile.user_id) or
    exists (select 1 from public.habit_logs where user_id = profile.user_id) or
    exists (select 1 from public.body_measurements where user_id = profile.user_id) or
    exists (select 1 from public.goals where user_id = profile.user_id) or
    exists (select 1 from public.reviews where user_id = profile.user_id)
  );

-- Una temporada creada automáticamente pero todavía vacía queda en preparación.
update public.seasons as season
set status = 'planned'
where season.status = 'active'
  and exists (
    select 1
    from public.profiles as profile
    where profile.user_id = season.user_id
      and profile.onboarding_completed = false
  );

-- 2. Esfuerzo y dominio son conceptos distintos.
alter table public.skills
  add column if not exists mastery_percent numeric(5,2)
    check (mastery_percent between 0 and 100),
  add column if not exists mastery_note text,
  add column if not exists mastery_updated_at timestamptz;

-- Reportes honestos de actividades. La futura IA podrá escribir aquí mediante
-- acciones controladas; ninguna evidencia externa es obligatoria.
create table if not exists public.activity_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  category text not null default 'general'
    check (category in ('general', 'study', 'training', 'habit', 'work', 'creative', 'faith', 'relationship')),
  description text not null check (length(btrim(description)) > 0),
  duration_minutes integer check (duration_minutes > 0),
  effort_rating smallint check (effort_rating between 1 and 5),
  result text,
  reported_at timestamptz not null default now(),
  created_via text not null default 'web',
  external_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.activity_reports is
  'Reportes basados en la confianza. external_context es opcional y nunca constituye un requisito de evidencia.';

-- 3. Registro simple de alimentación, sin calorías obligatorias.
create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_date date not null default current_date,
  meal_type text not null default 'other'
    check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
  description text not null check (length(btrim(description)) > 0),
  observation text,
  created_via text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Preparar no negociables sin activar cinco por defecto.
alter table public.habits
  add column if not exists system_key text,
  add column if not exists created_via text not null default 'web';

create unique index if not exists habits_user_system_key_uidx
  on public.habits (user_id, system_key)
  where system_key is not null;

-- 5. Índices, updated_at, RLS y permisos.
drop trigger if exists set_updated_at on public.meal_logs;
create trigger set_updated_at before update on public.meal_logs
for each row execute function public.set_updated_at();

create index if not exists activity_reports_user_date_idx
  on public.activity_reports (user_id, reported_at desc);
create index if not exists meal_logs_user_date_idx
  on public.meal_logs (user_id, meal_date desc, created_at desc);

alter table public.activity_reports enable row level security;
alter table public.meal_logs enable row level security;

drop policy if exists own_rows on public.activity_reports;
create policy own_rows on public.activity_reports
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists own_rows on public.meal_logs;
create policy own_rows on public.meal_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete
on public.activity_reports, public.meal_logs
to authenticated;

-- 6. Nuevas cuentas: perfil y áreas sí; temporada en preparación, sin hábitos
-- ni datos inventados. Los no negociables se eligen durante el onboarding.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, onboarding_completed)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      'Andre'
    ),
    false
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
    (user_id, name, description, start_date, end_date, status)
  select
    new.id,
    'Temporada 1',
    'Construir disciplina, avanzar en Ciencia de Datos y mejorar la salud.',
    current_date,
    current_date + 55,
    'planned'
  where not exists (
    select 1 from public.seasons where user_id = new.id
  );

  return new;
end;
$$;

-- Decisión editorial ya aprobada.
update public.rewards
set name = 'Ocio especial planificado'
where name = 'Noche libre sin culpa';

