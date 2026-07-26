import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HabitIds,
  HabitKey,
  HabitState,
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

type SubjectRow = { id: string; name: string };
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
type HabitRow = { id: string; title: string };
type HabitLogRow = { habit_id: string; completed: boolean };

function localDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
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
  const missing = (Object.keys(habitDefinitions) as HabitKey[])
    .filter((key) => !existingTitles.has(habitDefinitions[key].title))
    .map((key) => ({
      user_id: userId,
      title: habitDefinitions[key].title,
      habit_type: "non_negotiable",
      frequency: { type: "daily" },
      target_amount: 1,
      unit: habitDefinitions[key].unit,
      active: true,
      xp_reward: habitDefinitions[key].xp,
    }));

  if (missing.length === 0) return existing;

  const inserted = unwrap<HabitRow[]>(
    await client.from("habits").insert(missing).select("id, title"),
  );
  return [...existing, ...(inserted ?? [])];
}

function habitMaps(habits: HabitRow[], logs: HabitLogRow[]) {
  const ids: HabitIds = {};
  const checkins: HabitState = {
    prayer: false,
    hygiene: false,
    movement: false,
    planning: false,
    sleep: false,
  };
  const completedByHabit = new Map(
    logs.map((log) => [log.habit_id, log.completed]),
  );

  for (const key of Object.keys(habitDefinitions) as HabitKey[]) {
    const habit = habits.find(
      (candidate) => candidate.title === habitDefinitions[key].title,
    );
    if (!habit) continue;
    ids[key] = habit.id;
    checkins[key] = completedByHabit.get(habit.id) ?? false;
  }

  return { ids, checkins };
}

export async function loadDashboardData(
  client: SupabaseClient,
  userId: string,
) {
  const [subjectsResult, tasksResult, evaluationsResult, habitsResult] =
    await Promise.all([
      client
        .from("subjects")
        .select("id, name")
        .eq("user_id", userId)
        .order("name"),
      client
        .from("tasks")
        .select("id, title, subject_id, task_type, status, due_at")
        .eq("user_id", userId)
        .neq("status", "cancelled")
        .order("due_at", { ascending: true, nullsFirst: false }),
      client
        .from("evaluations")
        .select(
          "id, title, subject_id, evaluation_type, status, evaluation_at",
        )
        .eq("user_id", userId)
        .neq("status", "cancelled")
        .order("evaluation_at"),
      client
        .from("habits")
        .select("id, title")
        .eq("user_id", userId)
        .eq("active", true),
    ]);

  const subjects = unwrap<SubjectRow[]>(subjectsResult) ?? [];
  const taskRows = unwrap<TaskRow[]>(tasksResult) ?? [];
  const evaluationRows = unwrap<EvaluationRow[]>(evaluationsResult) ?? [];
  const existingHabits = unwrap<HabitRow[]>(habitsResult) ?? [];
  const habits = await ensureDefaultHabits(client, userId, existingHabits);
  const habitIds = habits.map((habit) => habit.id);
  const logs =
    habitIds.length === 0
      ? []
      : (unwrap<HabitLogRow[]>(
          await client
            .from("habit_logs")
            .select("habit_id, completed")
            .eq("user_id", userId)
            .eq("log_date", localDate())
            .in("habit_id", habitIds),
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
    return (left.dueDate ?? "9999-12-31").localeCompare(
      right.dueDate ?? "9999-12-31",
    );
  });

  return { tasks, ...habitMaps(habits, logs) };
}

async function resolveSubject(
  client: SupabaseClient,
  userId: string,
  name: string,
) {
  const normalized = name.trim() || "General";
  const result = await client
    .from("subjects")
    .select("id, name")
    .eq("user_id", userId);
  const subjects = unwrap<SubjectRow[]>(result) ?? [];
  const existing = subjects.find(
    (subject) =>
      subject.name.localeCompare(normalized, "es", {
        sensitivity: "accent",
      }) === 0,
  );
  if (existing) return existing;

  const inserted = unwrap<SubjectRow[]>(
    await client
      .from("subjects")
      .insert({
        user_id: userId,
        name: normalized,
        status: "studying",
      })
      .select("id, name"),
  );
  if (!inserted?.[0]) throw new Error("No se pudo crear la materia.");
  return inserted[0];
}

export async function createPlannerItem(
  client: SupabaseClient,
  userId: string,
  input: {
    title: string;
    subject: string;
    dueDate: string | null;
    type: "Tarea" | "Examen";
  },
) {
  const subject = await resolveSubject(client, userId, input.subject);

  if (input.type === "Examen") {
    if (!input.dueDate) {
      throw new Error("El examen necesita una fecha.");
    }
    unwrap(
      await client.from("evaluations").insert({
        user_id: userId,
        subject_id: subject.id,
        title: input.title,
        evaluation_type: "exam",
        evaluation_at: `${input.dueDate}T12:00:00-05:00`,
        status: "upcoming",
      }),
    );
  } else {
    unwrap(
      await client.from("tasks").insert({
        user_id: userId,
        subject_id: subject.id,
        title: input.title,
        task_type: "task",
        priority: "medium",
        status: "pending",
        due_at: input.dueDate
          ? `${input.dueDate}T18:00:00-05:00`
          : null,
      }),
    );
  }

  return loadDashboardData(client, userId);
}

export async function setPlannerItemCompleted(
  client: SupabaseClient,
  item: Task,
  completed: boolean,
) {
  const result =
    item.source === "evaluation"
      ? await client
          .from("evaluations")
          .update({ status: completed ? "completed" : "upcoming" })
          .eq("id", item.id)
      : await client
          .from("tasks")
          .update({
            status: completed ? "completed" : "pending",
            completed_at: completed ? new Date().toISOString() : null,
          })
          .eq("id", item.id);
  unwrap(result);
}

export async function setHabitCheckin(
  client: SupabaseClient,
  userId: string,
  habitId: string,
  completed: boolean,
) {
  unwrap(
    await client.from("habit_logs").upsert(
      {
        user_id: userId,
        habit_id: habitId,
        log_date: localDate(),
        amount: completed ? 1 : 0,
        completed,
      },
      { onConflict: "habit_id,log_date" },
    ),
  );
}
