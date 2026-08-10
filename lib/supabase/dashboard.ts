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
  MealLog,
  ProfileSettings,
  SeasonInfo,
  SeasonSetupInput,
  StoredSkill,
  SubjectSummary,
  Task,
  TaskState,
  TrackingPlan,
} from "@/lib/types";
import { addDaysToIsoDate, dateIsoInAppTimeZone, seasonWeekFromDate } from "@/lib/time";

const habitDefinitions: Record<
  HabitKey,
  { title: string; unit: string; systemKey: string }
> = {
  prayer: { title: "Oración", unit: "vez", systemKey: "prayer" },
  hygiene: { title: "Higiene básica", unit: "rutina", systemKey: "hygiene" },
  movement: { title: "Movimiento", unit: "sesión", systemKey: "movement" },
  planning: { title: "Planificar el día", unit: "vez", systemKey: "daily_planning" },
  sleep: { title: "Dormir a tiempo", unit: "vez", systemKey: "sleep_on_time" },
};

const digitalDefinitions = {
  screenTimeMinutes: { title: "Tiempo total de celular", unit: "min" },
  socialMediaMinutes: { title: "Redes sociales", unit: "min" },
  shortVideoMinutes: { title: "Videos cortos", unit: "min" },
  gamingMinutes: { title: "Videojuegos", unit: "min" },
  intentionalLeisureMinutes: { title: "Ocio intencional", unit: "min" },
  stimulationFastMinutes: { title: "Ayuno de estímulos", unit: "min" },
} as const;

const digitalSystemKeys: Record<keyof DigitalWellbeing, string> = {
  screenTimeMinutes: "screen_time",
  socialMediaMinutes: "social_media",
  shortVideoMinutes: "short_video",
  gamingMinutes: "gaming",
  intentionalLeisureMinutes: "intentional_leisure",
  stimulationFastMinutes: "stimulation_fast",
};

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
  system_key?: string | null;
  frequency: Record<string, unknown>;
  description: string | null;
  difficult_day_version: string | null;
  is_optional: boolean;
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
  height_cm: number | null;
  weight_kg: number | null;
  body_fat_percent: number | null;
  waist_cm: number | null;
  energy_level: number | null;
  sleep_hours: number | null;
  measurement_context: string | null;
};
type TrackingPlanRow = {
  id: string;
  area: TrackingPlan["area"];
  title: string;
  status: TrackingPlan["status"];
  start_date: string | null;
  end_date: string | null;
  instructions: unknown;
  notes: string | null;
};
type ReviewRow = {
  id: string;
  entry_date: string;
  content: string;
  mood: number | null;
};
type SkillRow = {
  id: string;
  name: string;
  current_xp: number;
  mastery_percent: number | null;
};

type ProfileRow = {
  coins: number;
  purpose: string | null;
  onboarding_completed: boolean;
  journal_ai_allowed: boolean;
};

type SeasonRow = {
  id: string;
  name: string;
  description: string | null;
  status: SeasonInfo["status"];
  start_date: string;
  end_date: string;
};

type MealRow = {
  id: string;
  meal_date: string;
  meal_type: string;
  description: string;
  observation: string | null;
};

function localDate(value = new Date()) {
  return dateIsoInAppTimeZone(value);
}

function recentDates(days: number) {
  const today = localDate();
  return Array.from({ length: days }, (_, index) =>
    addDaysToIsoDate(today, -(days - index - 1)),
  );
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
    stimulationFastMinutes: null,
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
      stimulationFastMinutes: null,
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
    const history = dates.map((date) => byDate.has(date) ? Boolean(byDate.get(date)) : null);
    const recordedDays = history.filter((value) => value !== null).length;
    let streak: number | null = recordedDays ? 0 : null;
    for (let index = history.length - 1; index >= 0 && history[index] === true; index -= 1) {
      streak = (streak ?? 0) + 1;
    }
    const completed = history.filter((value) => value === true).length;
    return {
      id: habit.id,
      title: habit.title,
      habitType: habit.habit_type,
      goal: habit.target_amount > 0 ? `${habit.target_amount} ${habit.unit}` : "Registrar",
      description: habit.description ?? "",
      difficultDayVersion: habit.difficult_day_version ?? "",
      optional: habit.is_optional,
      frequency: habit.frequency ?? { type: "daily" },
      streak,
      rate: recordedDays >= 7 ? Math.round((completed / recordedDays) * 100) : null,
      recordedDays,
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
    seasonResult,
    mealsResult,
    trackingPlansResult,
  ] = await Promise.all([
    client.from("subjects").select("id, name, status").eq("user_id", userId).order("name"),
    client.from("tasks").select("id, title, subject_id, task_type, status, due_at").eq("user_id", userId).neq("status", "cancelled").order("due_at", { ascending: true, nullsFirst: false }),
    client.from("evaluations").select("id, title, subject_id, evaluation_type, status, evaluation_at").eq("user_id", userId).neq("status", "cancelled").order("evaluation_at"),
    client.from("habits").select("id, title, habit_type, target_amount, unit, system_key, frequency, description, difficult_day_version, is_optional").eq("user_id", userId).eq("active", true),
    client.from("goals").select("id, title, reason, current_value, target_value, unit, target_date").eq("user_id", userId).eq("status", "active").order("created_at"),
    client.from("body_measurements").select("recorded_on, height_cm, weight_kg, body_fat_percent, waist_cm, energy_level, sleep_hours, measurement_context").eq("user_id", userId).order("recorded_on", { ascending: false }).limit(1),
    client.from("journal_entries").select("id, entry_date, content, mood").eq("user_id", userId).order("entry_date", { ascending: false }).order("created_at", { ascending: false }).limit(20),
    client.from("skills").select("id, name, current_xp, mastery_percent").eq("user_id", userId),
    client.from("skill_evidence").select("skill_id").eq("user_id", userId),
    client.from("xp_transactions").select("amount").eq("user_id", userId),
    client.from("profiles").select("coins, purpose, onboarding_completed, journal_ai_allowed").eq("user_id", userId).maybeSingle(),
    client.from("seasons").select("id, name, description, status, start_date, end_date").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    client.from("meal_logs").select("id, meal_date, meal_type, description, observation").eq("user_id", userId).order("meal_date", { ascending: false }).order("created_at", { ascending: false }).limit(12),
    client.from("tracking_plans").select("id, area, title, status, start_date, end_date, instructions, notes").eq("user_id", userId).order("start_date", { ascending: true, nullsFirst: false }),
  ]);

  const subjects = unwrap<SubjectRow[]>(subjectsResult) ?? [];
  const taskRows = unwrap<TaskRow[]>(tasksResult) ?? [];
  const evaluationRows = unwrap<EvaluationRow[]>(evaluationsResult) ?? [];
  const habits = unwrap<HabitRow[]>(habitsResult) ?? [];
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
        heightCm: latestBody.height_cm === null ? null : Number(latestBody.height_cm),
        weightKg: latestBody.weight_kg === null ? null : Number(latestBody.weight_kg),
        bodyFatPercent: latestBody.body_fat_percent === null ? null : Number(latestBody.body_fat_percent),
        waistCm: latestBody.waist_cm === null ? null : Number(latestBody.waist_cm),
        energyLevel: latestBody.energy_level,
        sleepHours: latestBody.sleep_hours === null ? null : Number(latestBody.sleep_hours),
        context: latestBody.measurement_context ?? "",
      }
    : null;
  const journalEntries: JournalEntry[] = (unwrap<ReviewRow[]>(reviewsResult) ?? [])
    .map((review) => ({
      id: review.id,
      date: review.entry_date,
      body: review.content,
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
    mastery: skill.mastery_percent === null ? null : Number(skill.mastery_percent),
  }));
  const totalXp = (unwrap<{ amount: number }[]>(xpResult) ?? []).reduce((sum, row) => sum + row.amount, 0);
  const profileRow = unwrap<ProfileRow>(profileResult);
  const seasonRow = unwrap<SeasonRow>(seasonResult);
  const profile: ProfileSettings = {
    onboardingCompleted: profileRow?.onboarding_completed ?? false,
    purpose: profileRow?.purpose ?? "",
    journalAiAllowed: profileRow?.journal_ai_allowed ?? false,
  };
  const season: SeasonInfo = {
    id: seasonRow?.id ?? null,
    name: seasonRow?.name ?? "Temporada 1",
    objective: seasonRow?.description ?? "",
    status: seasonRow?.status ?? "planned",
    startDate: seasonRow?.start_date ?? null,
    endDate: seasonRow?.end_date ?? null,
    week: seasonRow?.status === "active"
      ? seasonWeekFromDate(seasonRow.start_date)
      : null,
  };
  const meals: MealLog[] = (unwrap<MealRow[]>(mealsResult) ?? []).map((meal) => ({
    id: meal.id,
    mealDate: meal.meal_date,
    mealType: meal.meal_type,
    description: meal.description,
    observation: meal.observation ?? "",
  }));
  const trackingPlans: TrackingPlan[] = (unwrap<TrackingPlanRow[]>(trackingPlansResult) ?? []).map((plan) => ({
    id: plan.id,
    area: plan.area,
    title: plan.title,
    status: plan.status,
    startDate: plan.start_date,
    endDate: plan.end_date,
    instructions: Array.isArray(plan.instructions) ? plan.instructions.filter((item): item is string => typeof item === "string") : [],
    notes: plan.notes ?? "",
  }));

  return {
    tasks,
    subjects: subjectSummaries,
    goals,
    bodyMeasurement,
    journalEntries,
    skills,
    profile,
    season,
    meals,
    trackingPlans,
    totalXp: Math.max(0, totalXp),
    coins: profileRow?.coins ?? 0,
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
  const resolvedIds = { ...habitIds };
  const unresolvedKeys = Object.keys(digitalDefinitions).filter((key) => !resolvedIds[key]);
  if (unresolvedKeys.length) {
    const existing = unwrap<Array<{ id: string; system_key: string }>>(
      await client.from("habits").select("id, system_key").eq("user_id", userId).in("system_key", unresolvedKeys.map((key) => digitalSystemKeys[key as keyof DigitalWellbeing])),
    ) ?? [];
    for (const row of existing) {
      const key = Object.entries(digitalSystemKeys).find(([, systemKey]) => systemKey === row.system_key)?.[0];
      if (key) resolvedIds[key] = row.id;
    }
  }
  const missingKeys = unresolvedKeys.filter((key) => !resolvedIds[key]);
  if (missingKeys.length) {
    const inserted = unwrap<Array<{ id: string; system_key: string }>>(
      await client.from("habits").insert(missingKeys.map((key) => ({
        user_id: userId,
        title: digitalDefinitions[key as keyof typeof digitalDefinitions].title,
        habit_type: "habit",
        system_key: digitalSystemKeys[key as keyof DigitalWellbeing],
        frequency: { type: "daily" },
        target_amount: 0,
        unit: "min",
        active: true,
        xp_reward: 0,
      }))).select("id, system_key"),
    ) ?? [];
    for (const row of inserted) {
      const key = row.system_key === "screen_time" ? "screenTimeMinutes"
        : row.system_key === "social_media" ? "socialMediaMinutes"
          : row.system_key === "short_video" ? "shortVideoMinutes"
            : row.system_key === "gaming" ? "gamingMinutes"
              : row.system_key === "intentional_leisure" ? "intentionalLeisureMinutes"
                : "stimulationFastMinutes";
      resolvedIds[key] = row.id;
    }
  }
  const rows = Object.entries(values)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => ({
      user_id: userId,
      habit_id: resolvedIds[key],
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
  input: {
    title: string;
    habitType: "habit" | "non_negotiable";
    targetAmount: number;
    unit: string;
    frequency: Record<string, unknown>;
    description: string;
    difficultDayVersion: string;
    optional: boolean;
  },
) {
  if (input.habitType === "non_negotiable") {
    const activeMinimums = unwrap<Array<{ id: string }>>(
      await client.from("habits").select("id").eq("user_id", userId).eq("habit_type", "non_negotiable").eq("active", true),
    ) ?? [];
    if (activeMinimums.length >= 3) throw new Error("Solo puedes tener tres no negociables activos.");
  }
  const existing = unwrap<{ id: string }>(
    await client.from("habits").select("id").eq("user_id", userId).eq("title", input.title.trim()).limit(1).maybeSingle(),
  );
  const payload = {
    user_id: userId,
    title: input.title.trim(),
    habit_type: input.habitType,
    frequency: input.frequency,
    target_amount: input.targetAmount,
    unit: input.unit,
    description: input.description.trim() || null,
    difficult_day_version: input.difficultDayVersion.trim() || null,
    is_optional: input.optional,
    active: true,
    xp_reward: 0,
  };
  if (existing) {
    unwrap(await client.from("habits").update(payload).eq("id", existing.id).eq("user_id", userId));
  } else {
    unwrap(await client.from("habits").insert(payload));
  }
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
  input: Omit<BodyMeasurement, "recordedOn"> & { recordedOn?: string },
) {
  unwrap(await client.from("body_measurements").upsert({
    user_id: userId,
    recorded_on: input.recordedOn || localDate(),
    height_cm: input.heightCm,
    weight_kg: input.weightKg,
    body_fat_percent: input.bodyFatPercent,
    waist_cm: input.waistCm,
    energy_level: input.energyLevel,
    sleep_hours: input.sleepHours,
    measurement_context: input.context.trim() || null,
  }, { onConflict: "user_id,recorded_on" }));
}

export async function saveTrackingPlan(
  client: SupabaseClient,
  userId: string,
  input: Omit<TrackingPlan, "id">,
) {
  const existing = unwrap<{ id: string }>(
    await client.from("tracking_plans").select("id").eq("user_id", userId).eq("title", input.title.trim()).limit(1).maybeSingle(),
  );
  const payload = {
    area: input.area,
    title: input.title.trim(),
    status: input.status,
    start_date: input.startDate,
    end_date: input.endDate,
    instructions: input.instructions,
    notes: input.notes.trim() || null,
  };
  if (existing) {
    unwrap(await client.from("tracking_plans").update(payload).eq("id", existing.id).eq("user_id", userId));
  } else {
    unwrap(await client.from("tracking_plans").insert({ user_id: userId, ...payload }));
  }
}

export async function saveJournalEntry(
  client: SupabaseClient,
  userId: string,
  body: string,
  mood: number | null,
) {
  unwrap(await client.from("journal_entries").insert({
    user_id: userId,
    entry_type: "reflection",
    entry_date: localDate(),
    content: body,
    mood,
    created_via: "web",
  }));
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
  const existing = unwrap<SkillRow[]>(
    await client.from("skills").select("id, name, current_xp, mastery_percent").eq("user_id", userId).eq("name", input.skillName),
  )?.[0];
  let skillId = existing?.id;
  if (!skillId) {
    const inserted = unwrap<SkillRow[]>(
      await client.from("skills").insert({ user_id: userId, name: input.skillName, current_xp: 0 }).select("id, name, current_xp, mastery_percent"),
    );
    skillId = inserted?.[0]?.id;
  }
  if (skillId) {
    unwrap(await client.from("skill_evidence").insert({
      user_id: userId,
      skill_id: skillId,
      description: input.notes || `${input.durationMinutes} min de práctica reportada`,
      xp_awarded: 0,
    }));
  }
}

export async function saveMealLog(
  client: SupabaseClient,
  userId: string,
  input: { mealType: string; description: string; observation: string },
) {
  unwrap(await client.from("meal_logs").insert({
    user_id: userId,
    meal_type: input.mealType,
    description: input.description.trim(),
    observation: input.observation.trim() || null,
  }));
}

export async function saveActivityReport(
  client: SupabaseClient,
  userId: string,
  input: { description: string; category: string; durationMinutes: number | null; result: string },
) {
  unwrap(await client.from("activity_reports").insert({
    user_id: userId,
    description: input.description.trim(),
    category: input.category,
    duration_minutes: input.durationMinutes,
    result: input.result.trim() || null,
    created_via: "web",
  }));
}

async function ensureSubjectStatus(
  client: SupabaseClient,
  userId: string,
  name: string,
  status: "pending" | "studying",
) {
  const normalized = name.trim();
  if (!normalized) return null;
  const subjects = unwrap<SubjectRow[]>(
    await client.from("subjects").select("id, name, status").eq("user_id", userId),
  ) ?? [];
  const existing = subjects.find((subject) =>
    subject.name.localeCompare(normalized, "es", { sensitivity: "accent" }) === 0,
  );
  if (existing) {
    if (existing.status !== status) {
      unwrap(await client.from("subjects").update({ status }).eq("id", existing.id).eq("user_id", userId));
    }
    return { ...existing, status };
  }
  const inserted = unwrap<SubjectRow[]>(
    await client.from("subjects").insert({ user_id: userId, name: normalized, status }).select("id, name, status"),
  );
  if (!inserted?.[0]) throw new Error("No se pudo crear la materia.");
  return inserted[0];
}

async function persistSeasonSetup(
  client: SupabaseClient,
  userId: string,
  input: SeasonSetupInput,
  activate: boolean,
) {
  if (input.nonNegotiables.length > 3) {
    throw new Error("Puedes comenzar con un máximo de tres no negociables.");
  }
  if (activate && !input.startDate) {
    throw new Error("Confirma la fecha de inicio antes de comenzar.");
  }

  unwrap(await client.from("profiles").update({
    purpose: input.purpose.trim() || null,
    onboarding_completed: activate,
    onboarding_completed_at: activate ? new Date().toISOString() : null,
  }).eq("user_id", userId));

  const seasonRows = unwrap<SeasonRow[]>(
    await client.from("seasons").select("id, name, description, status, start_date, end_date").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
  ) ?? [];
  const existingSeason = seasonRows[0];
  const startDateValue = input.startDate || existingSeason?.start_date;
  if (!startDateValue) {
    throw new Error("Indica una fecha propuesta para guardar la preparación.");
  }
  const seasonPayload = {
    name: input.seasonName.trim() || existingSeason?.name || "Temporada 1",
    description: input.seasonObjective.trim() || null,
    status: activate ? "active" as const : "planned" as const,
    start_date: startDateValue,
    end_date: addDaysToIsoDate(startDateValue, 55),
  };
  if (existingSeason) {
    unwrap(await client.from("seasons").update(seasonPayload).eq("id", existingSeason.id).eq("user_id", userId));
  } else {
    unwrap(await client.from("seasons").insert({ user_id: userId, ...seasonPayload }));
  }

  unwrap(await client.from("habits").update({ active: false }).eq("user_id", userId).eq("habit_type", "non_negotiable"));
  for (const key of input.nonNegotiables) {
    const definition = habitDefinitions[key];
    const existing = unwrap<Array<{ id: string }>>(
      await client.from("habits").select("id").eq("user_id", userId).eq("system_key", definition.systemKey).limit(1),
    )?.[0];
    if (existing) {
      unwrap(await client.from("habits").update({ active: true, habit_type: "non_negotiable" }).eq("id", existing.id).eq("user_id", userId));
    } else {
      unwrap(await client.from("habits").insert({
        user_id: userId,
        title: definition.title,
        habit_type: "non_negotiable",
        system_key: definition.systemKey,
        frequency: { type: "daily" },
        target_amount: 1,
        unit: definition.unit,
        active: true,
        xp_reward: 0,
      }));
    }
  }

  for (const subjectName of input.currentSubjects.filter(Boolean)) {
    await ensureSubjectStatus(client, userId, subjectName, "studying");
  }
  for (const subjectName of input.plannedSubjects.filter(Boolean)) {
    await ensureSubjectStatus(client, userId, subjectName, "pending");
  }
  if (input.firstTask.trim()) {
    const existingTask = unwrap<{ id: string }>(
      await client.from("tasks").select("id").eq("user_id", userId).eq("title", input.firstTask.trim()).limit(1).maybeSingle(),
    );
    if (!existingTask) {
      await createPlannerItem(client, userId, {
        title: input.firstTask.trim(),
        subject: input.currentSubjects[0] || "General",
        dueDate: null,
        type: "Tarea",
      });
    }
  }

  const activity = input.scheduledActivity;
  if (activity?.title.trim() && activity.startDate) {
    const activitySubject = await ensureSubjectStatus(client, userId, activity.subject || activity.title, "studying");
    const activityPayload = {
      subject_id: activitySubject?.id ?? null,
      title: activity.title.trim(),
      description: activity.schedule.trim() || null,
      task_type: "appointment",
      priority: "medium",
      status: "pending",
      due_at: `${activity.startDate}T18:00:00-05:00`,
    };
    const existingActivity = unwrap<{ id: string }>(
      await client.from("tasks").select("id").eq("user_id", userId).eq("title", activity.title.trim()).eq("task_type", "appointment").limit(1).maybeSingle(),
    );
    if (existingActivity) {
      unwrap(await client.from("tasks").update(activityPayload).eq("id", existingActivity.id).eq("user_id", userId));
    } else {
      unwrap(await client.from("tasks").insert({ user_id: userId, ...activityPayload }));
    }
  }

  const futureGoal = input.futureGoal;
  if (futureGoal?.title.trim()) {
    const reason = [futureGoal.reason.trim(), futureGoal.activationNote.trim()].filter(Boolean).join(" ");
    const goalPayload = {
      title: futureGoal.title.trim(),
      reason: reason || null,
      current_value: null,
      target_value: futureGoal.targetValue,
      unit: futureGoal.unit.trim() || null,
      target_date: null,
      status: "paused",
    };
    const existingGoal = unwrap<{ id: string }>(
      await client.from("goals").select("id").eq("user_id", userId).eq("title", futureGoal.title.trim()).limit(1).maybeSingle(),
    );
    if (existingGoal) {
      unwrap(await client.from("goals").update(goalPayload).eq("id", existingGoal.id).eq("user_id", userId));
    } else {
      unwrap(await client.from("goals").insert({ user_id: userId, ...goalPayload }));
    }
  }

  if (input.body && Object.values(input.body).some((value) => value !== null)) {
    await saveBodyMeasurement(client, userId, input.body);
  }
  if (input.screens && Object.values(input.screens).some((value) => value !== null)) {
    await saveDigitalWellbeing(client, userId, {}, input.screens);
  }
}

export async function saveOnboardingDraft(client: SupabaseClient, userId: string, input: SeasonSetupInput) {
  await persistSeasonSetup(client, userId, input, false);
}

export async function completeOnboarding(client: SupabaseClient, userId: string, input: SeasonSetupInput) {
  await persistSeasonSetup(client, userId, input, true);
}
