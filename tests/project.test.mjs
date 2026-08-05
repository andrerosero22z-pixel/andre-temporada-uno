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
