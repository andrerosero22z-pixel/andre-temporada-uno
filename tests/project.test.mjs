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
