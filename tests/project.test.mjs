import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps Supabase authentication and Google sign-in configured", async () => {
  const [authScreen, client] = await Promise.all([
    readFile(new URL("../components/auth-screen.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/supabase/client.ts", import.meta.url), "utf8"),
  ]);

  assert.match(authScreen, /signInWithOAuth/);
  assert.match(authScreen, /provider:\s*"google"/);
  assert.match(client, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(client, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
});

test("persists the first real tracking modules instead of demo-only actions", async () => {
  const [page, dashboard] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/supabase/dashboard.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Pantallas/);
  assert.match(page, /saveJournalEntry/);
  assert.match(page, /saveBodyMeasurement/);
  assert.match(page, /saveStudySession/);
  assert.match(dashboard, /saveDigitalWellbeing/);
  assert.match(dashboard, /Tiempo total de celular/);
  assert.match(dashboard, /Videos cortos/);
  assert.match(dashboard, /createGoal/);
});

test("gives dopamine and attention a real view with seven-day history", async () => {
  const [page, dashboard, types] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/supabase/dashboard.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/types.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /id: "dopamine"/);
  assert.match(page, /Entrena tu atención/);
  assert.match(page, /Mapa de consumo digital/);
  assert.match(page, /Ayuno de estímulos/);
  assert.match(page, /Hábitos atómicos/);
  assert.match(dashboard, /digitalHistory/);
  assert.match(dashboard, /stimulationFastMinutes/);
  assert.match(types, /DigitalDay/);
  assert.match(types, /stimulationFastMinutes/);
});

test("keeps technical labels and fake academic progress out of the interface", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(page, /Supabase · núcleo real/);
  assert.doesNotMatch(page, /Versión 2 · RPG/);
  assert.doesNotMatch(page, /Bases de Datos · examen del viernes/);
  assert.match(page, /nextExam && <section className="path-card panel">/);
});

test("separates nutrition into a real tracking page and keeps empty cards aligned", async () => {
  const [page, styles, types] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../lib/types.ts", import.meta.url), "utf8"),
  ]);

  assert.match(types, /\| "nutrition"/);
  assert.match(page, /id: "nutrition"/);
  assert.match(page, /view === "nutrition"/);
  assert.match(page, /toggleTrackedHabit/);
  assert.doesNotMatch(page, /name: "Nutrición"/);
  assert.match(styles, /\.empty-state\s*\{[\s\S]*?padding:\s*26px/);
  assert.match(styles, /\.subject-grid > \.empty-state/);
});

test("keeps the authenticated dashboard inside the viewport with game icons", async () => {
  const [page, styles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /from "lucide-react"/);
  assert.match(page, /FlagTriangleRight/);
  assert.match(styles, /max-width:\s*calc\(100vw - 238px\)/);
  assert.doesNotMatch(styles, /\.workspace,\s*\.topbar[\s\S]{0,160}width:\s*100%/);
});

test("ships an additive AI-ready database migration with RLS and idempotency", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/202608040001_ai_ready_core.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /create table if not exists public\.journal_entries/);
  assert.match(migration, /create table if not exists public\.goal_progress_logs/);
  assert.match(migration, /create table if not exists public\.evaluation_steps/);
  assert.match(migration, /create table if not exists public\.daily_plans/);
  assert.match(migration, /create table if not exists public\.activity_events/);
  assert.match(migration, /idempotency_key/);
  assert.match(migration, /enable row level security/);
  assert.doesNotMatch(migration, /drop table/i);
});

test("keeps new accounts in preparation until onboarding is confirmed", async () => {
  const [page, onboarding, dashboard, migration] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/season-onboarding.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/supabase/dashboard.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608040002_consolidate_first_season.sql", import.meta.url), "utf8"),
  ]);

  assert.match(page, /SeasonOnboarding/);
  assert.match(onboarding, /Comenzar Temporada 1/);
  assert.match(onboarding, /current\.length === 3/);
  assert.match(dashboard, /completeOnboarding/);
  assert.match(migration, /onboarding_completed boolean not null default false/);
  assert.match(migration, /'planned'/);
});

test("distinguishes unknown measurements and trends from real zero counts", async () => {
  const [page, dashboard, types] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/supabase/dashboard.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/types.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Aún no calculado/);
  assert.match(page, /digitalWellbeing\[key\] == null \? "Sin datos"/);
  assert.match(page, /useState\(""\);[\s\S]*?const \[numberValue/);
  assert.doesNotMatch(page, /<strong>45 min<\/strong>/);
  assert.match(dashboard, /rate: recordedDays >= 7[\s\S]*?: null/);
  assert.match(types, /rate: number \| null/);
});

test("implements trust-based reports without automatic XP or evidence requirements", async () => {
  const [page, dashboard, migration] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/supabase/dashboard.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608040002_consolidate_first_season.sql", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Tu reporte honesto es suficiente/);
  assert.match(page, /nunca resta XP/);
  assert.match(dashboard, /saveActivityReport/);
  assert.doesNotMatch(dashboard, /xp_transactions"\)\.insert/);
  assert.match(migration, /create table if not exists public\.activity_reports/);
  assert.match(migration, /external_context es opcional/);
});

test("adds System, progress tabs, attention resources and simple meal logging", async () => {
  const [page, styles, dashboard, types, migration] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../lib/supabase/dashboard.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608040002_consolidate_first_season.sql", import.meta.url), "utf8"),
  ]);

  assert.match(types, /\| "system"/);
  assert.match(page, /Sistema y perfil/);
  assert.match(page, /General<\/button>/);
  assert.match(page, /Recursos<\/button>/);
  assert.match(page, /Registrar alimentación/);
  assert.match(page, /Ocio especial planificado/);
  assert.match(styles, /\.system-grid/);
  assert.match(styles, /\.onboarding-shell/);
  assert.match(dashboard, /saveMealLog/);
  assert.match(migration, /create table if not exists public\.meal_logs/);
});

test("keeps the public review route isolated from Supabase authentication", async () => {
  const [page, review] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/review/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(review, /<Dashboard forcedReview/);
  assert.match(page, /if \(reviewMode\) return;/);
  assert.match(page, /Sin acceso a datos privados · solo lectura/);
  assert.match(page, /Vista previa: la temporada no se guardó ni accedió a datos privados/);
  assert.match(page, /\(reviewMode \|\| dataStatus === "ready"\) && season\.status === "planned"/);
});

test("keeps consolidation migrations additive and protects every new table with RLS", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/202608040002_consolidate_first_season.sql", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(migration, /drop table/i);
  assert.doesNotMatch(migration, /truncate/i);
  assert.match(migration, /alter table public\.activity_reports enable row level security/);
  assert.match(migration, /alter table public\.meal_logs enable row level security/);
  assert.match(migration, /using \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(migration, /with check \(\(select auth\.uid\(\)\) = user_id\)/);
});

test("exposes an explicit season setup from Today and System", async () => {
  const [page, onboarding, dashboard] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/season-onboarding.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/supabase/dashboard.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Configurar Temporada 1/);
  assert.match(page, /Configurar y comenzar/);
  assert.match(onboarding, /useState\(""\)/);
  assert.match(onboarding, /Comenzar Temporada 1/);
  assert.match(dashboard, /status: "active"/);
  assert.match(dashboard, /addDaysToIsoDate\(input\.startDate, 55\)/);
});

test("uses a compact five-action mobile navigation with a complete More panel", async () => {
  const [page, styles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /mobilePrimaryNavItems = navItems\.slice\(0, 4\)/);
  assert.match(page, /Más módulos/);
  assert.match(page, /label: "Sistema"/);
  assert.match(page, /aria-label="Cerrar menú"/);
  assert.match(styles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.mobile-more-panel/);
});

test("keeps the first server and client render stable before reading the clock", async () => {
  const [page, onboarding, time] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/season-onboarding.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/time.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /useState<\{ today: string; greeting: string \} \| null>\(null\)/);
  assert.match(page, /clientClock \? formatAppDate\(clientClock\.today\) : "Hoy"/);
  assert.doesNotMatch(page, /\{todayLabel\(\)\}/);
  assert.doesNotMatch(onboarding, /useState\(localToday\(\)\)/);
  assert.match(time, /seasonWeekFromDate/);
  assert.doesNotMatch(page, /suppressHydrationWarning/);
});
