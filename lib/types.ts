export type View =
  | "today"
  | "studies"
  | "progress"
  | "goals"
  | "habits"
  | "journal";

export type MissionStatus = "pending" | "active" | "done";
export type TaskState = "today" | "upcoming" | "done";
export type PlannerItemSource = "task" | "evaluation";

export type Task = {
  id: string;
  source: PlannerItemSource;
  title: string;
  subject: string;
  dueDate: string | null;
  type: "Tarea" | "Examen" | "Práctica";
  state: TaskState;
};

export type Skill = {
  name: string;
  level: number;
  xp: number;
  next: number;
  evidence: string;
  focus: string;
};

export type AttributeGroup = {
  name: string;
  level: number;
  icon: string;
  color: string;
  description: string;
  skills: Skill[];
};

export type HabitKey =
  | "prayer"
  | "hygiene"
  | "movement"
  | "planning"
  | "sleep";

export type HabitState = Record<HabitKey, boolean>;
export type HabitIds = Partial<Record<HabitKey, string>>;
