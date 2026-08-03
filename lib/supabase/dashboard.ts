import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BodyMeasurement,
  DashboardData,
  DigitalDay,
  DigitalWellbeing,
  GoalRecord,
  HabitIds,
  HabitKey,
  HabitOverview,
  HabitState,
  JournalEntry,
  StoredSkill,
  SubjectSummary,
  Task,
  TaskState,
} from "@/lib/types";

const TIME_ZONE = "America/Guayaquil";

const habitDefinitions: Record<
  HabitKey,
  { title: string; unit: string; xp: number }
> = {
  prayer: { title: "Oración", unit: "vez", xp: 5 },
  hygiene: { title: "Higiene básica", unit: "rutina", xp: 5 },
  movement: { title: "Movimiento", unit: "sesión", xp: 5 },
  planning: { title: "Planificar el día", unit: "vez", xp: 5 },
  sleep: { title: "Dormir a tiempo", unit: "vez", xp: 5 },
};

const digitalDefinitions = {
  screenTimeMinutes: { title: "Tiempo total de celular", unit: "min" },
  socialMediaMinutes: { title: "Redes sociales", unit: "min" },
  shortVideoMinutes: { title: "Videos cortos", unit: "min" },
  gamingMinutes: { title: "Videojuegos", unit: "min" },
  intentionalLeisureMinutes: { title: "Ocio intencional", unit: "min" },
} as const;

type SubjectRow = {
  id: string;
  name: string;
  status: SubjectSummary["status"];
};
type TaskRow = {
  id: string;
  title: string;
  subject_id: string | null;
  task_type: "task" | "mission" | "project" | "appointment";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  due_at: string | null;
};
type EvaluationRow = {
  id: string;
  title: string;
  subject_id: string | null;
  evaluation_type: "exam" | "quiz" | "assignment" | "presentation" | "project";
  status: "upcoming" | "preparing" | "completed" | "cancelled";
  evaluation_at: string;
};
type HabitRow = {
  id: string;
  title: string;
  habit_type: "habit" | "non_negotiable";
  target_amount: number;
  unit: string;
};
type HabitLogRow = {
  habit_id: string;
  log_date: string;
  completed: boolean;
  amount: number;
};
type GoalRow = {
  id: string;
  title: string;
  reason: string | null;
  current_value: number | null;
  target_value: number | null;
  unit: string | null;
  target_date: string | null;
};
type BodyRow = {
  recorded_on: string;
  weight_kg: number | null;
  body_fat_percent: number | null;
  waist_cm: number | null;
  energy_level: number | null;
  sleep_hours: number | null;
};
type ReviewRow = {
  id: string;
  review_date: string;
  lessons: string | null;
  mood: number | null;
};
type SkillRow = {
  id: string;
  name: string;
  current_xp: number;
};

function localDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function recentDates(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - index - 1));
    return localDate(date);
  });
}

function datePart(value: string | null) {
  if (!value) return null;
  return localDate(new Date(value));
}

function plannerState(completed: boolean, dueAt: string | null): TaskState {
  if (completed) return "done";
  const dueDate = datePart(dueAt);
  return !dueDate || dueDate <= localDate() ? "today" : "upcoming";
}

function subjectName(subjects: Map<string, string>, id: string | null) {
  return (id && subjects.get(id)) || "General";
}

function taskType(value: TaskRow["task_type"]): Task["type"] {
  return value === "mission" ? "Práctica" : "Tarea";
}

function evaluationType(value: EvaluationRow["evaluation_type"]): Task["type"] {
  return value === "assignment" || value === "project" ? "Tarea" : "Examen";
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

async function ensureDefaultHabits(
  client: SupabaseClient,
  userId: string,
  existing: HabitRow[],
) {
  const existingTitles = new Set(existing.map((habit) => habit.title));
  const defaults = [
    ...(Object.keys(habitDefinitions) as HabitKey[]).map((key) => ({
      title: habitDefinitions[key].title,
      habit_type: "non_negotiable" as const,
      target_amount: 1,
      unit: habitDefinitions[key].unit,
      xp_reward: habitDefinitions[key].xp,
    })),
    ...Object.values(digitalDefinitions).map((definition) => ({
      title: definition.title,
      habit_type: "habit" as const,
      target_amount: 0,
      unit: definition.unit,
      xp_reward: 0,
    })),
  ];
  const missing = defaults
    .filter((definition) => !existingTitles.has(definition.title))
    .map((definition) => ({
      user_id: userId,
      ...definition,
      frequency: { type: "daily" },
      active: true,
    }));

  if (missing.length === 0) return existing;
  const inserted = unwrap<HabitRow[]>(
    await client
      .from("habits")
      .insert(missing)
      .select("id, title, habit_type, target_amount, unit"),
  );
  return [...existing, ...(inserted ?? [])];
}

function buildHabitData(habits: HabitRow[], logs: HabitLogRow[]) {
  const ids: HabitIds = {};
  const checkins: HabitState = {
    prayer: false,
    hygiene: false,
    movement: false,
    planning: false,
    sleep: false,
  };
  const today = localDate();
  const todayLogs = new Map(
    logs.filter((log) => log.log_date === today).map((log) => [log.habit_id, log]),
  );

  for (const key of Object.keys(habitDefinitions) as HabitKey[]) {
    const habit = habits.find((candidate) => candidate.title === habitDefinitions[key].title);
    if (!habit) continue;
    ids[key] = habit.id;
    checkins[key] = todayLogs.get(habit.id)?.completed ?? false;
  }

  const digitalHabitIds: Record<string, string> = {};
  const digitalWellbeing: DigitalWellbeing = {
    screenTimeMinutes: null,
    socialMediaMinutes: null,
    shortVideoMinutes: null,
    gamingMinutes: null,
    intentionalLeisureMinutes: null,
  };
  for (const [key, definition] of Object.entries(digitalDefinitions)) {
    const habit = habits.find((candidate) => candidate.title === definition.title);
    if (!habit) continue;
    digitalHabitIds[key] = habit.id;
    const log = todayLogs.get(habit.id);
    digitalWellbeing[key as keyof DigitalWellbeing] = log ? Number(log.amount) : null;
  }

  const dates = recentDates(28);
  const logsByHabitAndDate = new Map(
    logs.map((log) => [`${log.habit_id}:${log.log_date}`, Number(log.amount)]),
  );
  const digitalHistory: DigitalDay[] = dates.map((date) => {
    const day: DigitalDay = {
      date,
      screenTimeMinutes: null,
      socialMediaMinutes: null,
      shortVideoMinutes: null,
      gamingMinutes: null,
      intentionalLeisureMinutes: null,
    };

    for (const [key, habitId] of Object.entries(digitalHabitIds)) {
      const amount = logsByHabitAndDate.get(`${habitId}:${date}`);
      day[key as keyof DigitalWellbeing] = amount ?? null;
    }
    return day;
  });
  const visibleHabits = habits.filter(
    (habit) => !Object.values(digitalDefinitions).some((metric) => metric.title === habit.title),
  );
  const habitRows: HabitOverview[] = visibleHabits.map((habit) => {
    const byDate = new Map(
      logs.filter((log) => log.habit_id === habit.id).map((log) => [log.log_date, log.completed]),
    );
    const history = dates.map((date) => byDate.get(date) ?? false);
    let streak = 0;
    for (let index = history.length - 1; index >= 0 && history[index]; index -= 1) streak += 1;
    const completed = history.filter(Boolean).length;
    return {
      id: habit.id,
      title: habit.title,
      habitType: habit.habit_type,
      goal: habit.target_amount > 0 ? `${habit.target_amount} ${habit.unit}` : "Registrar",
      streak,
      rate: Math.round((completed / 28) * 100),
      week: history.slice(-7),
    };
  });
  const heatmap = dates.map((date) =>
    visibleHabits.filter((habit) =>
      logs.some((log) => log.habit_id === habit.id && log.log_date === date && log.completed),
    ).length,
  );
  return { ids, checkins, digitalHabitIds, digitalWellbeing, digitalHistory, habitRows, heatmap };
}

export async function loadDashboardData(
  client: SupabaseClient,
  userId: string,
): Promise<DashboardData> {
  const since = recentDates(28)[0];
  const [
    subjectsResult,
    tasksResult,
    evaluationsResult,
    habitsResult,
    goalsResult,
    bodyResult,
    reviewsResult,
    skillsResult,
    evidenceResult,
    xpResult,
    profileResult,
  ] = await Promise.all([
    client.from("subjects").select("id, name, status").eq("user_id", userId).order("name"),
    client.from("tasks").select("id, title, subject_id, task_type, status, due_at").eq("user_id", userId).neq("status", "cancelled").order("due_at", { ascending: true, nullsFirst: false }),
    client.from("evaluations").select("id, title, subject_id, evaluation_type, status, evaluation_at").eq("user_id", userId).neq("status", "cancelled").order("evaluation_at"),
    client.from("habits").select("id, title, habit_type, target_amount, unit").eq("user_id", userId).eq("active", true),
    client.from("goals").select("id, title, reason, current_value, target_value, unit, target_date").eq("user_id", userId).eq("status", "active").order("created_at"),
    client.from("body_measurements").select("recorded_on, weight_kg, body_fat_percent, waist_cm, energy_level, sleep_hours").eq("user_id", userId).order("recorded_on", { ascending: false }).limit(1),
    client.from("reviews").select("id, review_date, lessons, mood").eq("user_id", userId).eq("review_type", "daily").order("review_date", { ascending: false }).limit(20),
    client.from("skills").select("id, name, current_xp").eq("user_id", userId),
    client.from("skill_evidence").select("skill_id").eq("user_id", userId),
    client.from("xp_transactions").select("amount").eq("user_id", userId),
    client.from("profiles").select("coins").eq("user_id", userId).maybeSingle(),
  ]);

  const subjects = unwrap<SubjectRow[]>(subjectsResult) ?? [];
  const taskRows = unwrap<TaskRow[]>(tasksResult) ?? [];
  const evaluationRows = unwrap<EvaluationRow[]>(evaluationsResult) ?? [];
  const existingHabits = unwrap<HabitRow[]>(habitsResult) ?? [];
  const habits = await ensureDefaultHabits(client, userId, existingHabits);
  const habitIds = habits.map((habit) => habit.id);
  const logs = habitIds.length === 0
    ? []
    : (unwrap<HabitLogRow[]>(
        await client.from("habit_logs").select("habit_id, log_date, completed, amount").eq("user_id", userId).gte("log_date", since).in("habit_id", habitIds),
      ) ?? []);

  const names = new Map(subjects.map((subject) => [subject.id, subject.name]));
  const tasks: Task[] = [
    ...taskRows.map((row) => ({
      id: row.id,
      source: "task" as const,
      title: row.title,
      subject: subjectName(names, row.subject_id),
      dueDate: datePart(row.due_at),
      type: taskType(row.task_type),
      state: plannerState(row.status === "completed", row.due_at),
    })),
    ...evaluationRows.map((row) => ({
      id: row.id,
      source: "evaluation" as const,
      title: row.title,
      subject: subjectName(names, row.subject_id),
      dueDate: datePart(row.evaluation_at),
      type: evaluationType(row.evaluation_type),
      state: plannerState(row.status === "completed", row.evaluation_at),
    })),
  ].sort((left, right) => {
    if (left.state === "done" && right.state !== "done") return 1;
    if (right.state === "done" && left.state !== "done") return -1;
    return (left.dueDate ?? "9999-12-31").localeCompare(right.dueDate ?? "9999-12-31");
  });

  const subjectSummaries: SubjectSummary[] = subjects.map((subject) => {
    const related = tasks.filter((task) => task.subject === subject.name);
    const completed = related.filter((task) => task.state === "done").length;
    const next = related.find((task) => task.state !== "done");
    return {
      id: subject.id,
      name: subject.name,
      status: subject.status,
      progress: related.length ? Math.round((completed / related.length) * 100) : 0,
      pendingItems: related.length - completed,
      nextItem: next ? `${next.type} · ${next.dueDate ?? "sin fecha"}` : "Sin pendientes",
    };
  });

  const goals: GoalRecord[] = (unwrap<GoalRow[]>(goalsResult) ?? []).map((goal) => ({
    id: goal.id,
    title: goal.title,
    reason: goal.reason ?? "",
    currentValue: goal.current_value === null ? null : Number(goal.current_value),
    targetValue: goal.target_value === null ? null : Number(goal.target_value),
    unit: goal.unit ?? "",
    targetDate: goal.target_date,
  }));
  const latestBody = (unwrap<BodyRow[]>(bodyResult) ?? [])[0];
  const bodyMeasurement: BodyMeasurement | null = latestBody
    ? {
        recordedOn: latestBody.recorded_on,
        weightKg: latestBody.weight_kg === null ? null : Number(latestBody.weight_kg),
        bodyFatPercent: latestBody.body_fat_percent === null ? null : Number(latestBody.body_fat_percent),
        waistCm: latestBody.waist_cm === null ? null : Number(latestBody.waist_cm),
        energyLevel: latestBody.energy_level,
        sleepHours: latestBody.sleep_hours === null ? null : Number(latestBody.sleep_hours),
      }
    : null;
  const journalEntries: JournalEntry[] = (unwrap<ReviewRow[]>(reviewsResult) ?? [])
    .filter((review) => review.lessons)
    .map((review) => ({
      id: review.id,
      date: review.review_date,
      body: review.lessons ?? "",
      mood: review.mood,
    }));
  const evidenceCounts = new Map<string, number>();
  for (const evidence of unwrap<{ skill_id: string }[]>(evidenceResult) ?? []) {
    evidenceCounts.set(evidence.skill_id, (evidenceCounts.get(evidence.skill_id) ?? 0) + 1);
  }
  const skills: StoredSkill[] = (unwrap<SkillRow[]>(skillsResult) ?? []).map((skill) => ({
    id: skill.id,
    name: skill.name,
    xp: skill.current_xp,
    evidenceCount: evidenceCounts.get(skill.id) ?? 0,
  }));
  const totalXp = (unwrap<{ amount: number }[]>(xpResult) ?? []).reduce((sum, row) => sum + row.amount, 0);
  const profile = unwrap<{ coins: number }>(profileResult);

  return {
    tasks,
    subjects: subjectSummaries,
    goals,
    bodyMeasurement,
    journalEntries,
    skills,
    totalXp: Math.max(0, totalXp),
    coins: profile?.coins ?? 0,
    ...buildHabitData(habits, logs),
  };
}

async function resolveSubject(client: SupabaseClient, userId: string, name: string) {
  const normalized = name.trim() || "General";
  const subjects = unwrap<SubjectRow[]>(
    await client.from("subjects").select("id, name, status").eq("user_id", userId),
  ) ?? [];
  const existing = subjects.find((subject) =>
    subject.name.localeCompare(normalized, "es", { sensitivity: "accent" }) === 0,
  );
  if (existing) return existing;
  const inserted = unwrap<SubjectRow[]>(
    await client.from("subjects").insert({ user_id: userId, name: normalized, status: "studying" }).select("id, name, status"),
  );
  if (!inserted?.[0]) throw new Error("No se pudo crear la materia.");
  return inserted[0];
}

export async function createPlannerItem(
  client: SupabaseClient,
  userId: string,
  input: { title: string; subject: string; dueDate: string | null; type: "Tarea" | "Examen" },
) {
  const subject = await resolveSubject(client, userId, input.subject);
  if (input.type === "Examen") {
    if (!input.dueDate) throw new Error("El examen necesita una fecha.");
    unwrap(await client.from("evaluations").insert({
      user_id: userId,
      subject_id: subject.id,
      title: input.title,
      evaluation_type: "exam",
      evaluation_at: `${input.dueDate}T12:00:00-05:00`,
      status: "upcoming",
    }));
  } else {
    unwrap(await client.from("tasks").insert({
      user_id: userId,
      subject_id: subject.id,
      title: input.title,
      task_type: "task",
      priority: "medium",
      status: "pending",
      due_at: input.dueDate ? `${input.dueDate}T18:00:00-05:00` : null,
    }));
  }
}

export async function setPlannerItemCompleted(client: SupabaseClient, item: Task, completed: boolean) {
  const result = item.source === "evaluation"
    ? await client.from("evaluations").update({ status: completed ? "completed" : "upcoming" }).eq("id", item.id)
    : await client.from("tasks").update({ status: completed ? "completed" : "pending", completed_at: completed ? new Date().toISOString() : null }).eq("id", item.id);
  unwrap(result);
}

export async function setHabitCheckin(client: SupabaseClient, userId: string, habitId: string, completed: boolean) {
  unwrap(await client.from("habit_logs").upsert({
    user_id: userId,
    habit_id: habitId,
    log_date: localDate(),
    amount: completed ? 1 : 0,
    completed,
  }, { onConflict: "habit_id,log_date" }));
}

export async function saveDigitalWellbeing(
  client: SupabaseClient,
  userId: string,
  habitIds: Record<string, string>,
  values: DigitalWellbeing,
) {
  const rows = Object.entries(values)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => ({
      user_id: userId,
      habit_id: habitIds[key],
      log_date: localDate(),
      amount: value,
      completed: true,
    }))
    .filter((row) => row.habit_id);
  if (!rows.length) throw new Error("Registra al menos un tiempo.");
  unwrap(await client.from("habit_logs").upsert(rows, { onConflict: "habit_id,log_date" }));
}

export async function createHabit(
  client: SupabaseClient,
  userId: string,
  input: { title: string; targetAmount: number; unit: string },
) {
  unwrap(await client.from("habits").insert({
    user_id: userId,
    title: input.title,
    habit_type: "habit",
    frequency: { type: "daily" },
    target_amount: input.targetAmount,
    unit: input.unit,
    active: true,
    xp_reward: 5,
  }));
}

export async function createGoal(
  client: SupabaseClient,
  userId: string,
  input: { title: string; currentValue: number | null; targetValue: number | null; unit: string; targetDate: string | null; reason: string },
) {
  unwrap(await client.from("goals").insert({
    user_id: userId,
    title: input.title,
    current_value: input.currentValue,
    target_value: input.targetValue,
    unit: input.unit || null,
    target_date: input.targetDate,
    reason: input.reason || null,
    status: "active",
  }));
}

export async function saveBodyMeasurement(
  client: SupabaseClient,
  userId: string,
  input: Omit<BodyMeasurement, "recordedOn">,
) {
  unwrap(await client.from("body_measurements").upsert({
    user_id: userId,
    recorded_on: localDate(),
    weight_kg: input.weightKg,
    body_fat_percent: input.bodyFatPercent,
    waist_cm: input.waistCm,
    energy_level: input.energyLevel,
    sleep_hours: input.sleepHours,
  }, { onConflict: "user_id,recorded_on" }));
}

export async function saveJournalEntry(
  client: SupabaseClient,
  userId: string,
  body: string,
  mood: number | null,
) {
  unwrap(await client.from("reviews").upsert({
    user_id: userId,
    review_type: "daily",
    review_date: localDate(),
    lessons: body,
    mood,
  }, { onConflict: "user_id,review_type,review_date" }));
}

export async function saveStudySession(
  client: SupabaseClient,
  userId: string,
  input: { subject: string; skillName: string; durationMinutes: number; mode: "reading" | "guided" | "practice" | "independent" | "simulation"; notes: string },
) {
  const subject = await resolveSubject(client, userId, input.subject);
  unwrap(await client.from("study_sessions").insert({
    user_id: userId,
    subject_id: subject.id,
    duration_minutes: input.durationMinutes,
    study_mode: input.mode,
    notes: input.notes || null,
  }));
  const xp = Math.max(5, Math.round(input.durationMinutes / 5)) + (input.mode === "simulation" ? 15 : input.mode === "independent" ? 8 : 0);
  const existing = unwrap<SkillRow[]>(
    await client.from("skills").select("id, name, current_xp").eq("user_id", userId).eq("name", input.skillName),
  )?.[0];
  let skillId = existing?.id;
  if (existing) {
    unwrap(await client.from("skills").update({ current_xp: existing.current_xp + xp }).eq("id", existing.id));
  } else {
    const inserted = unwrap<SkillRow[]>(
      await client.from("skills").insert({ user_id: userId, name: input.skillName, level: 1, current_xp: xp, next_level_xp: 100 }).select("id, name, current_xp"),
    );
    skillId = inserted?.[0]?.id;
  }
  if (skillId) {
    unwrap(await client.from("skill_evidence").insert({ user_id: userId, skill_id: skillId, description: input.notes || `${input.durationMinutes} min de práctica`, xp_awarded: xp }));
    unwrap(await client.from("xp_transactions").insert({ user_id: userId, skill_id: skillId, amount: xp, reason: `Sesión de ${input.skillName}`, source_type: "study_session" }));
  }
}
