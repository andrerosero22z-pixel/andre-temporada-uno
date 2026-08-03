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
  assert.match(page, /Dopamina y atención/);
  assert.match(page, /Mapa de consumo digital/);
  assert.match(dashboard, /digitalHistory/);
  assert.match(types, /DigitalDay/);
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
