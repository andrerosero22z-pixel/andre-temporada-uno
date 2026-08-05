export type View =
  | "today"
  | "studies"
  | "progress"
  | "goals"
  | "habits"
  | "nutrition"
  | "dopamine"
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

export type SubjectSummary = {
  id: string;
  name: string;
  status: "pending" | "studying" | "passed" | "failed";
  progress: number;
  pendingItems: number;
  nextItem: string;
};

export type GoalRecord = {
  id: string;
  title: string;
  reason: string;
  currentValue: number | null;
  targetValue: number | null;
  unit: string;
  targetDate: string | null;
};

export type BodyMeasurement = {
  recordedOn: string;
  weightKg: number | null;
  bodyFatPercent: number | null;
  waistCm: number | null;
  energyLevel: number | null;
  sleepHours: number | null;
};

export type JournalEntry = {
  id: string;
  date: string;
  body: string;
  mood: number | null;
};

export type HabitOverview = {
  id: string;
  title: string;
  habitType: "habit" | "non_negotiable";
  goal: string;
  streak: number;
  rate: number;
  week: boolean[];
};

export type DigitalWellbeing = {
  screenTimeMinutes: number | null;
  socialMediaMinutes: number | null;
  shortVideoMinutes: number | null;
  gamingMinutes: number | null;
  intentionalLeisureMinutes: number | null;
  stimulationFastMinutes: number | null;
};

export type DigitalDay = DigitalWellbeing & {
  date: string;
};

export type StoredSkill = {
  id: string;
  name: string;
  xp: number;
  evidenceCount: number;
};

export type HabitKey =
  | "prayer"
  | "hygiene"
  | "movement"
  | "planning"
  | "sleep";

export type HabitState = Record<HabitKey, boolean>;
export type HabitIds = Partial<Record<HabitKey, string>>;

export type DashboardData = {
  tasks: Task[];
  checkins: HabitState;
  ids: HabitIds;
  subjects: SubjectSummary[];
  goals: GoalRecord[];
  bodyMeasurement: BodyMeasurement | null;
  journalEntries: JournalEntry[];
  habitRows: HabitOverview[];
  heatmap: number[];
  digitalWellbeing: DigitalWellbeing;
  digitalHistory: DigitalDay[];
  digitalHabitIds: Record<string, string>;
  skills: StoredSkill[];
  totalXp: number;
  coins: number;
};
