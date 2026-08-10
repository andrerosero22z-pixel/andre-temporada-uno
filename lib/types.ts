export type View =
  | "today"
  | "studies"
  | "progress"
  | "goals"
  | "habits"
  | "nutrition"
  | "dopamine"
  | "journal"
  | "system";

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
  level: number | null;
  xp: number;
  next: number | null;
  mastery?: number | null;
  evidence: string;
  focus: string;
};

export type AttributeGroup = {
  name: string;
  level: number | null;
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
  heightCm: number | null;
  weightKg: number | null;
  bodyFatPercent: number | null;
  waistCm: number | null;
  energyLevel: number | null;
  sleepHours: number | null;
  context: string;
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
  description: string;
  difficultDayVersion: string;
  optional: boolean;
  frequency: Record<string, unknown>;
  streak: number | null;
  rate: number | null;
  recordedDays: number;
  week: Array<boolean | null>;
};

export type TrackingPlan = {
  id: string;
  area: "nutrition" | "attention" | "physical" | "study" | "general";
  title: string;
  status: "planned" | "active" | "paused" | "completed";
  startDate: string | null;
  endDate: string | null;
  instructions: string[];
  notes: string;
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

export type SeasonSetupInput = {
  seasonName: string;
  seasonObjective: string;
  purpose: string;
  nonNegotiables: HabitKey[];
  currentSubjects: string[];
  plannedSubjects: string[];
  firstTask: string;
  startDate: string;
  scheduledActivity: {
    title: string;
    subject: string;
    startDate: string;
    schedule: string;
  } | null;
  futureGoal: {
    title: string;
    targetValue: number | null;
    unit: string;
    reason: string;
    activationNote: string;
  } | null;
  body: Omit<BodyMeasurement, "recordedOn"> | null;
  screens: DigitalWellbeing | null;
};

export type StoredSkill = {
  id: string;
  name: string;
  xp: number;
  evidenceCount: number;
  mastery: number | null;
};

export type SeasonInfo = {
  id: string | null;
  name: string;
  objective: string;
  status: "planned" | "active" | "completed";
  startDate: string | null;
  endDate: string | null;
  week: number | null;
};

export type ProfileSettings = {
  onboardingCompleted: boolean;
  purpose: string;
  journalAiAllowed: boolean;
};

export type MealLog = {
  id: string;
  mealDate: string;
  mealType: string;
  description: string;
  observation: string;
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
  trackingPlans: TrackingPlan[];
  journalEntries: JournalEntry[];
  habitRows: HabitOverview[];
  heatmap: number[];
  digitalWellbeing: DigitalWellbeing;
  digitalHistory: DigitalDay[];
  digitalHabitIds: Record<string, string>;
  skills: StoredSkill[];
  profile: ProfileSettings;
  season: SeasonInfo;
  meals: MealLog[];
  totalXp: number;
  coins: number;
};
