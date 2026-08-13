-- Andre: Temporada Uno
-- Primera fase de Estudios: clasificación de materias y compromiso de tareas.
-- Migración estrictamente aditiva; no modifica datos ni políticas RLS.

alter table public.subjects
  add column if not exists subject_type text not null default 'university'
    check (subject_type in ('university', 'course', 'self_study')),
  add column if not exists starts_on date,
  add column if not exists ends_on date;

alter table public.subjects
  drop constraint if exists subjects_date_range_check;

alter table public.subjects
  add constraint subjects_date_range_check
  check (ends_on is null or starts_on is null or ends_on >= starts_on);

alter table public.tasks
  add column if not exists commitment_level text not null default 'fixed'
    check (commitment_level in ('fixed', 'flexible', 'optional'));

create index if not exists subjects_user_type_status_idx
  on public.subjects (user_id, subject_type, status);

create index if not exists tasks_user_commitment_status_idx
  on public.tasks (user_id, commitment_level, status);

comment on column public.subjects.subject_type is
  'Clasifica el registro como materia universitaria, curso o autoestudio.';

comment on column public.tasks.commitment_level is
  'fixed es obligatorio/programado; flexible y optional no cuentan como incumplimiento.';
