"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  CalendarClock,
  CalendarDays,
  Clock3,
  Eye,
  Settings2,
  FlagTriangleRight,
  Gamepad2,
  House,
  Menu,
  MessageCircleMore,
  MoonStar,
  PenLine,
  Play,
  Repeat2,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Utensils,
  X,
  type LucideIcon,
} from "lucide-react";
import { AuthScreen } from "@/components/auth-screen";
import { SeasonOnboarding, type OnboardingInput } from "@/components/season-onboarding";
import {
  completeOnboarding,
  createGoal,
  createHabit,
  createPlannerItem,
  loadDashboardData,
  saveBodyMeasurement,
  saveDigitalWellbeing,
  saveJournalEntry,
  saveMealLog,
  saveOnboardingDraft,
  saveActivityReport,
  saveStudySession,
  saveTrackingPlan,
  setHabitCheckin,
  setPlannerItemCompleted,
} from "@/lib/supabase/dashboard";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  AttributeGroup,
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
  MissionStatus,
  ProfileSettings,
  SeasonInfo,
  Skill,
  StoredSkill,
  SubjectSummary,
  Task,
  TaskState,
  TrackingPlan,
  View,
} from "@/lib/types";
import {
  addDaysToIsoDate,
  dateIsoInAppTimeZone,
  formatAppDate,
  formatPlannerDate,
  greetingForAppTime,
  seasonWeekFromDate,
} from "@/lib/time";

const navItems: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "today", label: "Hoy", icon: House },
  { id: "studies", label: "Planificador", icon: CalendarDays },
  { id: "progress", label: "Progreso", icon: TrendingUp },
  { id: "goals", label: "Metas", icon: Target },
  { id: "habits", label: "Hábitos", icon: Repeat2 },
  { id: "nutrition", label: "Nutrición", icon: Utensils },
  { id: "dopamine", label: "Atención", icon: BrainCircuit },
  { id: "journal", label: "Diario", icon: BookOpenText },
];

const mobilePrimaryNavItems = navItems.slice(0, 4);
const mobileMoreNavItems: { id: View; label: string; icon: LucideIcon }[] = [
  ...navItems.slice(4),
  { id: "system", label: "Sistema", icon: Settings2 },
];

const digitalMetricCards: { key: keyof DigitalWellbeing; label: string; detail: string; icon: LucideIcon }[] = [
  { key: "screenTimeMinutes", label: "Celular total", detail: "Uso registrado hoy", icon: Smartphone },
  { key: "socialMediaMinutes", label: "Redes sociales", detail: "Feeds y mensajería", icon: MessageCircleMore },
  { key: "shortVideoMinutes", label: "Videos cortos", detail: "Reels, Shorts y TikTok", icon: Play },
  { key: "gamingMinutes", label: "Videojuegos", detail: "Tiempo de juego", icon: Gamepad2 },
  { key: "intentionalLeisureMinutes", label: "Ocio intencional", detail: "Descanso elegido", icon: MoonStar },
  { key: "stimulationFastMinutes", label: "Ayuno de estímulos", detail: "Sin feeds, videos ni juegos", icon: Clock3 },
];

const attentionBooks = [
  { title: "Hábitos atómicos", author: "James Clear", theme: "Sistema y constancia" },
  { title: "Trabajo profundo", author: "Cal Newport", theme: "Concentración" },
  { title: "Nación dopamina", author: "Anna Lembke", theme: "Recompensa y compulsión" },
];

const nutritionHabitSuggestions = [
  { title: "Planificar comidas", detail: "Decidir antes de tener hambre", unit: "vez" },
  { title: "Preparar una comida", detail: "Reducir la improvisación", unit: "comida" },
  { title: "Comer sin pantalla", detail: "Una comida con atención", unit: "comida" },
  { title: "Registrar alimentación", detail: "Observar sin juzgar", unit: "registro" },
];

function habitFrequencyLabel(habit: HabitOverview) {
  const type = String(habit.frequency.type ?? "daily");
  const start = typeof habit.frequency.start_date === "string" ? ` · desde ${habit.frequency.start_date}` : "";
  const schedule = typeof habit.frequency.schedule === "string" && habit.frequency.schedule ? ` · ${habit.frequency.schedule}` : "";
  const min = typeof habit.frequency.duration_min === "number" ? habit.frequency.duration_min : null;
  const max = typeof habit.frequency.duration_max === "number" ? habit.frequency.duration_max : null;
  const duration = min ? ` · ${min}${max ? `–${max}` : ""} min` : "";
  if (type === "weekdays") return `${habit.goal} · lunes a viernes${schedule}${start}`;
  if (type === "weekly") return `${habit.goal} por semana${duration}${schedule}${start}`;
  if (type === "continuous_cycle") return `${habit.goal} por semana · ciclo continuo${duration}${habit.optional ? " · quinta oportunidad opcional" : ""}`;
  return `${habit.goal} al día${schedule}${start}`;
}

const phases = [
  { label: "Diagnóstico", state: "pending" },
  { label: "Comprensión", state: "pending" },
  { label: "Práctica guiada", state: "pending" },
  { label: "Práctica solo", state: "pending" },
  { label: "Simulacro", state: "pending" },
];

const attributeGroups: AttributeGroup[] = [
  {
    name: "Ciencia de Datos",
    level: 7,
    icon: "◈",
    color: "#8fa9d7",
    description: "Competencias técnicas de la carrera, medidas con ejercicios, proyectos y evaluaciones.",
    skills: [
      {
        name: "Matemática",
        level: 7,
        xp: 240,
        next: 350,
        evidence: "18 ejercicios · 2 pruebas",
        focus: "Resolver problemas completos sin mirar el procedimiento.",
      },
      {
        name: "Estadística",
        level: 5,
        xp: 95,
        next: 220,
        evidence: "7 sesiones · 1 práctica",
        focus: "Interpretar resultados, no solo aplicar fórmulas.",
      },
      {
        name: "SQL y Bases de Datos",
        level: 8,
        xp: 330,
        next: 450,
        evidence: "3 simulacros · 74% dominio",
        focus: "Transacciones y diseño sin ayuda.",
      },
      {
        name: "Python",
        level: 6,
        xp: 175,
        next: 300,
        evidence: "4 proyectos · 16 prácticas",
        focus: "Resolver un análisis completo sin copiar código.",
      },
      {
        name: "Machine Learning",
        level: 2,
        xp: 45,
        next: 140,
        evidence: "2 prácticas introductorias",
        focus: "Entrenar y evaluar un primer modelo con criterio.",
      },
      {
        name: "Visualización de datos",
        level: 4,
        xp: 120,
        next: 220,
        evidence: "3 dashboards · 1 presentación",
        focus: "Contar una conclusión clara con datos.",
      },
    ],
  },
  {
    name: "Físico",
    level: 6,
    icon: "⌁",
    color: "#b57d68",
    description: "Composición corporal, rendimiento, salud y apariencia medidos con acciones reales.",
    skills: [
      {
        name: "Composición corporal",
        level: 3,
        xp: 65,
        next: 180,
        evidence: "Medición inicial pendiente",
        focus: "Registrar peso, cintura y una estimación responsable de grasa corporal.",
      },
      {
        name: "Fuerza",
        level: 7,
        xp: 265,
        next: 360,
        evidence: "9 entrenamientos · 4 marcas",
        focus: "Recuperar constancia sin abandonar en semana de exámenes.",
      },
      {
        name: "Resistencia",
        level: 4,
        xp: 80,
        next: 180,
        evidence: "5 sesiones de cardio",
        focus: "Dos sesiones breves por semana.",
      },
      {
        name: "Movilidad y postura",
        level: 3,
        xp: 72,
        next: 170,
        evidence: "4 rutinas breves",
        focus: "Hacer movilidad tres veces por semana y revisar la postura.",
      },
      {
        name: "Apariencia y cuidado",
        level: 4,
        xp: 105,
        next: 210,
        evidence: "Higiene y presentación registradas",
        focus: "Construir una rutina sostenible de piel, cabello, ropa y presentación.",
      },
    ],
  },
  {
    name: "Creatividad",
    level: 5,
    icon: "✧",
    color: "#a995cf",
    description: "Habilidades expresivas que crecen con práctica y obras terminadas.",
    skills: [
      {
        name: "Guitarra",
        level: 5,
        xp: 145,
        next: 240,
        evidence: "6 prácticas · 2 canciones",
        focus: "Tocar una canción completa sin detenerte.",
      },
      {
        name: "Producción musical",
        level: 4,
        xp: 125,
        next: 220,
        evidence: "2 piezas · 5 sesiones",
        focus: "Terminar una mezcla equilibrada sin sobresaturarla.",
      },
      {
        name: "Comunicación",
        level: 6,
        xp: 165,
        next: 280,
        evidence: "8 escritos · 3 exposiciones",
        focus: "Explicar ideas complejas con orden y claridad.",
      },
    ],
  },
  {
    name: "Dinero y Trabajo",
    level: 4,
    icon: "◇",
    color: "#c19b70",
    description: "Orden financiero y capacidad de convertir habilidades en valor.",
    skills: [
      {
        name: "Presupuesto",
        level: 4,
        xp: 110,
        next: 200,
        evidence: "2 semanas registradas",
        focus: "Registrar gastos sin dejar días vacíos.",
      },
      {
        name: "Ahorro",
        level: 3,
        xp: 70,
        next: 160,
        evidence: "1 meta activa",
        focus: "Definir una cantidad semanal realista.",
      },
      {
        name: "Portafolio profesional",
        level: 2,
        xp: 55,
        next: 150,
        evidence: "1 proyecto documentado",
        focus: "Publicar un caso completo de Ciencia de Datos.",
      },
      {
        name: "Negocio familiar",
        level: 6,
        xp: 210,
        next: 310,
        evidence: "App y procesos en desarrollo",
        focus: "Convertir mejoras técnicas en tiempo o dinero ahorrado.",
      },
    ],
  },
];

const initialTasks: Task[] = [];

function subscribeToReviewMode() {
  return () => undefined;
}

function getReviewModeSnapshot() {
  return new URLSearchParams(window.location.search).get("review") === "1";
}

function getReviewModeServerSnapshot() {
  return false;
}

function formatTaskDate(value: string | null, state: TaskState) {
  if (state === "done") return "Completada";
  if (!value) return "Sin fecha";

  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("es-EC", {
    timeZone: "America/Guayaquil",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function ProgressBar({
  value,
  accent = "var(--blue)",
  small = false,
}: {
  value: number;
  accent?: string;
  small?: boolean;
}) {
  return (
    <div
      className={`progress-track ${small ? "progress-track--small" : ""}`}
      aria-label={`${Math.round(value)}% hacia el siguiente nivel`}
    >
      <span
        className="progress-fill"
        style={{ width: `${Math.min(value, 100)}%`, background: accent }}
      />
    </div>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark ${compact ? "brand-mark--compact" : ""}`}>
      <span className="brand-mark__north">✦</span>
      <span className="brand-mark__ring" />
      <span className="brand-mark__core">◆</span>
    </div>
  );
}

function Modal({
  title,
  eyebrow,
  children,
  onClose,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal__close" onClick={onClose} aria-label="Cerrar ventana">
          ×
        </button>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="modal-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}

function SkillCard({
  skill,
  color,
  selected,
  onSelect,
}: {
  skill: Skill;
  color: string;
  selected?: boolean;
  onSelect: () => void;
}) {
  const hasMastery = skill.mastery !== null && skill.mastery !== undefined;

  return (
    <button
      className={`skill-card ${selected ? "skill-card--selected" : ""}`}
      onClick={onSelect}
    >
      <div className="skill-card__head">
        <span className="skill-level" style={{ borderColor: color, color }}>
          {hasMastery ? `${Math.round(skill.mastery ?? 0)}%` : "—"}
        </span>
        <span>
          <strong>{skill.name}</strong>
          <small>{skill.evidence}</small>
        </span>
        <i>→</i>
      </div>
      <div className="skill-xp">
        <span>{skill.xp} XP de esfuerzo</span>
        <span>{hasMastery ? "Dominio reportado" : "Dominio por registrar"}</span>
      </div>
      {hasMastery && <ProgressBar value={skill.mastery ?? 0} accent={color} small />}
    </button>
  );
}

export function Dashboard({ forcedReview = false }: { forcedReview?: boolean }) {
  const [authStatus, setAuthStatus] = useState<
    "checking" | "signed_in" | "signed_out"
  >("checking");
  const [userId, setUserId] = useState("");
  const [userLabel, setUserLabel] = useState("Andre");
  const reviewFromQuery = useSyncExternalStore(
    subscribeToReviewMode,
    getReviewModeSnapshot,
    getReviewModeServerSnapshot,
  );
  const reviewMode = forcedReview || reviewFromQuery;
  const [view, setView] = useState<View>("today");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [clientClock, setClientClock] = useState<{ today: string; greeting: string } | null>(null);
  const [missionStatus, setMissionStatus] =
    useState<MissionStatus>("pending");
  const [, setHabits] = useState<HabitState>({
    prayer: false,
    hygiene: false,
    movement: false,
    planning: false,
    sleep: false,
  });
  const [habitIds, setHabitIds] = useState<HabitIds>({});
  const [modal, setModal] = useState<"quick" | "close" | "study" | "recovery" | "meal" | "plan" | null>(null);
  const [toast, setToast] = useState("");
  const [entryType, setEntryType] = useState("Sesión de estudio");
  const [note, setNote] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskSubject, setTaskSubject] = useState("");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [subjectData, setSubjectData] = useState<SubjectSummary[]>([]);
  const [goalData, setGoalData] = useState<GoalRecord[]>([]);
  const [bodyMeasurement, setBodyMeasurement] = useState<BodyMeasurement | null>(null);
  const [journalData, setJournalData] = useState<JournalEntry[]>([]);
  const [mealData, setMealData] = useState<MealLog[]>([]);
  const [trackingPlans, setTrackingPlans] = useState<TrackingPlan[]>([]);
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({ onboardingCompleted: false, purpose: "", journalAiAllowed: false });
  const [season, setSeason] = useState<SeasonInfo>({ id: null, name: "Temporada 1", objective: "", status: "planned", startDate: null, endDate: null, week: null });
  const [habitData, setHabitData] = useState<HabitOverview[]>([]);
  const [heatmapData, setHeatmapData] = useState<number[]>(Array(28).fill(0));
  const [digitalWellbeing, setDigitalWellbeing] = useState<DigitalWellbeing>({
    screenTimeMinutes: null,
    socialMediaMinutes: null,
    shortVideoMinutes: null,
    gamingMinutes: null,
    intentionalLeisureMinutes: null,
    stimulationFastMinutes: null,
  });
  const [digitalHistory, setDigitalHistory] = useState<DigitalDay[]>([]);
  const [digitalHabitIds, setDigitalHabitIds] = useState<Record<string, string>>({});
  const [storedSkills, setStoredSkills] = useState<StoredSkill[]>([]);
  const [totalXp, setTotalXp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [habitPeriod, setHabitPeriod] = useState<7 | 28>(28);
  const [dataStatus, setDataStatus] = useState<"loading" | "ready" | "error">("loading");
  const [activeAttribute, setActiveAttribute] = useState("Ciencia de Datos");
  const [selectedSkillName, setSelectedSkillName] = useState(attributeGroups[0].skills[0].name);
  const [saving, setSaving] = useState(false);
  const [duration, setDuration] = useState("");
  const [numberValue, setNumberValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [mood, setMood] = useState("");
  const [progressTab, setProgressTab] = useState<"general" | "career" | "skills">("general");
  const [attentionTab, setAttentionTab] = useState<"overview" | "resources">("overview");
  const [mealType, setMealType] = useState("lunch");
  const [mealObservation, setMealObservation] = useState("");
  const [activityCategory, setActivityCategory] = useState("general");
  const [habitForm, setHabitForm] = useState({ kind: "habit", frequency: "daily", weeklyTarget: "", durationMin: "", durationMax: "", startDate: "", schedule: "", details: "", difficultDay: "", optional: false, cycle: "" });
  const [planForm, setPlanForm] = useState({ area: "nutrition", title: "", status: "active", startDate: "", endDate: "", instructions: "", notes: "" });
  const [studyMode, setStudyMode] = useState<"reading" | "guided" | "practice" | "independent" | "simulation">("practice");
  const [digitalForm, setDigitalForm] = useState({ screen: "", social: "", shortVideo: "", gaming: "", leisure: "", fast: "" });
  const [bodyForm, setBodyForm] = useState({ recordedOn: "", height: "", weight: "", waist: "", fat: "", energy: "", sleep: "", context: "" });

  const realAttributeGroups = useMemo(() => attributeGroups.map((group) => {
    const skills = group.skills.map((skill) => {
      const stored = storedSkills.find((candidate) => candidate.name === skill.name);
      const xp = stored?.xp ?? 0;
      return {
        ...skill,
        level: stored?.mastery == null ? null : Math.max(1, Math.ceil(stored.mastery / 20)),
        mastery: stored?.mastery ?? null,
        xp,
        next: null,
        evidence: stored?.evidenceCount
          ? `${stored.evidenceCount} evidencia${stored.evidenceCount === 1 ? "" : "s"}`
          : "Sin evidencia registrada",
      };
    });
    const mastered = skills.filter((skill) => skill.mastery != null);
    return {
      ...group,
      level: mastered.length
        ? Math.round(mastered.reduce((sum, skill) => sum + (skill.mastery ?? 0), 0) / mastered.length)
        : null,
      skills,
    };
  }), [storedSkills]);

  const activeGroup =
    realAttributeGroups.find((group) => group.name === activeAttribute) ??
    realAttributeGroups[0];
  const selectedSkill = activeGroup.skills.find((skill) => skill.name === selectedSkillName)
    ?? activeGroup.skills[0];
  const primaryTask =
    tasks.find((task) => task.state === "today") ??
    tasks.find((task) => task.state === "upcoming");
  const nextExam = tasks.find(
    (task) => task.type === "Examen" && task.state !== "done",
  );
  const completedThisWeek = habitData.reduce(
    (sum, habit) => sum + habit.week.filter((value) => value === true).length,
    0,
  );
  const weeklyPossible = habitData.reduce(
    (sum, habit) => sum + habit.week.filter((value) => value !== null).length,
    0,
  );
  const weeklyRate = weeklyPossible >= 7
    ? Math.round((completedThisWeek / weeklyPossible) * 100)
    : null;
  const habitsWithRates = habitData.filter((habit) => habit.rate !== null);
  const strongestHabit = [...habitsWithRates].sort((left, right) => (right.streak ?? 0) - (left.streak ?? 0))[0];
  const weakestHabit = [...habitsWithRates].sort((left, right) => (left.rate ?? 0) - (right.rate ?? 0))[0];
  const recentDigitalDays = digitalHistory.slice(-7);
  const recordedDigitalDays = recentDigitalDays.filter((day) => day.screenTimeMinutes !== null);
  const averageDigital = (key: keyof DigitalWellbeing) => {
    const values = recentDigitalDays
      .map((day) => day[key])
      .filter((value): value is number => value !== null);
    return values.length >= 3 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  };
  const hasRapidStimuliToday = digitalWellbeing.socialMediaMinutes !== null || digitalWellbeing.shortVideoMinutes !== null;
  const rapidStimuliToday = hasRapidStimuliToday ? (digitalWellbeing.socialMediaMinutes ?? 0) + (digitalWellbeing.shortVideoMinutes ?? 0) : null;
  const classifiedScreenToday = rapidStimuliToday == null ? null : rapidStimuliToday + (digitalWellbeing.gamingMinutes ?? 0);
  const unclassifiedScreenToday = digitalWellbeing.screenTimeMinutes == null || classifiedScreenToday == null ? null : Math.max(0, digitalWellbeing.screenTimeMinutes - classifiedScreenToday);
  const attentionControlToday = digitalWellbeing.screenTimeMinutes === null
    ? null
    : digitalWellbeing.screenTimeMinutes === 0
      ? 100
      : Math.max(0, Math.min(100, Math.round(((digitalWellbeing.screenTimeMinutes - (rapidStimuliToday ?? 0)) / digitalWellbeing.screenTimeMinutes) * 100)));
  const digitalInsight = recordedDigitalDays.length < 3
    ? "Registra al menos tres días para descubrir cuándo el celular te ayuda y cuándo empieza a dirigir tu atención."
    : (rapidStimuliToday ?? 0) >= 90
      ? "Hoy los estímulos rápidos ocuparon una parte importante del día. Conviene proteger el siguiente bloque sin redes ni videos cortos."
      : (rapidStimuliToday ?? 0) > 0
        ? "Ya tienes una línea base de estímulos rápidos. La meta no es cero pantalla: es que el uso sea elegido y no automático."
        : "Hoy no registraste redes ni videos cortos. Comprueba que el dato esté completo antes de sacar conclusiones.";
  const averageSocial = averageDigital("socialMediaMinutes");
  const averageShortVideo = averageDigital("shortVideoMinutes");
  const averageRapid = averageSocial == null || averageShortVideo == null ? null : averageSocial + averageShortVideo;
  const physicalRates = [habitData.find((habit) => habit.title === "Movimiento")?.rate, habitData.find((habit) => habit.title === "Dormir a tiempo")?.rate].filter((value): value is number => value != null);
  const realLifeStats: Array<{ name: string; value: number | null; detail: string; change: string; color: string }> = [
    { name: "Disciplina", value: weeklyRate, detail: "Últimos registros de hábitos y mínimos", change: weeklyRate == null ? "Aún no calculado" : `${completedThisWeek} de ${weeklyPossible} registros`, color: "#d3ac66" },
    { name: "Salud física", value: physicalRates.length === 2 ? Math.round(physicalRates.reduce((sum, value) => sum + value, 0) / physicalRates.length) : null, detail: "Movimiento y descanso registrados", change: bodyMeasurement ? "Línea base registrada" : "Aún no calculado", color: "#b98275" },
    { name: "Enfoque mental", value: recordedDigitalDays.length >= 7 ? attentionControlToday : null, detail: "Uso elegido y estímulos rápidos", change: recordedDigitalDays.length < 7 ? "Aún no calculado" : "Basado en los últimos 7 días", color: "#8fa9d7" },
    { name: "Avance de carrera", value: subjectData.length ? Math.round((subjectData.filter((subject) => subject.status === "passed").length / subjectData.length) * 100) : null, detail: "Materias aprobadas sobre pénsum registrado", change: subjectData.length ? `${subjectData.filter((subject) => subject.status === "passed").length} de ${subjectData.length} materias` : "Pénsum por registrar", color: "#9a8cc2" },
    { name: "Orden financiero", value: null, detail: "Presupuesto, ahorro e ingresos", change: "Aún no calculado", color: "#c19b70" },
    { name: "Equilibrio personal", value: habitData.find((habit) => habit.title === "Oración")?.rate ?? null, detail: "Fe, descanso y ocio intencional", change: "Aún no calculado", color: "#7f9eb8" },
  ];
  const realBodyMetrics = [
    { label: "Estatura", value: bodyMeasurement?.heightCm == null ? "Por registrar" : `${bodyMeasurement.heightCm} cm`, trend: bodyMeasurement?.context || "Línea base" },
    { label: "Peso", value: bodyMeasurement?.weightKg == null ? "Por registrar" : `${bodyMeasurement.weightKg} kg`, trend: "Línea base" },
    { label: "Cintura", value: bodyMeasurement?.waistCm == null ? "Por registrar" : `${bodyMeasurement.waistCm} cm`, trend: "Línea base" },
    { label: "Grasa estimada", value: bodyMeasurement?.bodyFatPercent == null ? "Por registrar" : `${bodyMeasurement.bodyFatPercent}%`, trend: "Meta personal" },
    { label: "Energía", value: bodyMeasurement?.energyLevel == null ? "Por registrar" : `${bodyMeasurement.energyLevel} / 5`, trend: bodyMeasurement?.recordedOn ?? "Línea base" },
  ];
  const nutritionPattern = /aliment|nutric|comida|agua|proteína|fruta|verdura/i;
  const nutritionHabits = habitData.filter((habit) => nutritionPattern.test(habit.title));
  const nutritionGoals = goalData.filter((goal) => nutritionPattern.test(`${goal.title} ${goal.reason ?? ""}`));
  const nutritionConsistency = nutritionHabits.length
    && nutritionHabits.every((habit) => habit.rate != null)
    ? Math.round(nutritionHabits.reduce((sum, habit) => sum + (habit.rate ?? 0), 0) / nutritionHabits.length)
    : null;
  const strongestNutritionHabit = [...nutritionHabits].sort((left, right) => (right.streak ?? 0) - (left.streak ?? 0))[0];
  const plannerDays = useMemo(() => !clientClock ? [] : Array.from({ length: 7 }, (_, index) => {
    const iso = addDaysToIsoDate(clientClock.today, index);
    const parts = formatPlannerDate(iso);
    return {
      iso,
      day: parts.day,
      date: parts.date,
      count: tasks.filter((task) => task.dueDate === iso && task.state !== "done").length,
      active: index === 0,
    };
  }), [clientClock, tasks]);
  const activeMinimumItems = habitData.filter((habit) => habit.habitType === "non_negotiable" && !habit.optional);
  const completedHabits = activeMinimumItems.filter((habit) => habit.week.at(-1) === true).length;
  const seasonLabel = season.status === "active" && season.week
    ? `${season.name} · Semana ${season.week}`
    : "En preparación";

  const currentDateLabel = clientClock ? formatAppDate(clientClock.today) : "Hoy";
  const greetingLabel = clientClock?.greeting ?? "Hola";

  function applyDashboardData(data: DashboardData) {
    setTasks(data.tasks);
    setHabits(data.checkins);
    setHabitIds(data.ids);
    setSubjectData(data.subjects);
    setGoalData(data.goals);
    setBodyMeasurement(data.bodyMeasurement);
    setJournalData(data.journalEntries);
    setMealData(data.meals);
    setTrackingPlans(data.trackingPlans);
    setProfileSettings(data.profile);
    setSeason(data.season);
    setHabitData(data.habitRows);
    setHeatmapData(data.heatmap);
    setDigitalWellbeing(data.digitalWellbeing);
    setDigitalHistory(data.digitalHistory);
    setDigitalHabitIds(data.digitalHabitIds);
    setStoredSkills(data.skills);
    setTotalXp(data.totalXp);
    setCoins(data.coins);
  }

  async function refreshData() {
    if (!userId) return;
    const data = await loadDashboardData(getSupabaseBrowserClient(), userId);
    applyDashboardData(data);
  }

  async function startSeason(input: OnboardingInput) {
    if (reviewMode) {
      const endDate = addDaysToIsoDate(input.startDate, 55);
      setProfileSettings((current) => ({ ...current, purpose: input.purpose.trim(), onboardingCompleted: true }));
      setSeason({
        id: "review-season",
        name: input.seasonName.trim() || "Temporada 1",
        objective: input.seasonObjective.trim(),
        status: "active",
        startDate: input.startDate,
        endDate,
        week: seasonWeekFromDate(input.startDate, clientClock?.today),
      });
      setShowOnboarding(false);
      notify("Vista previa: la temporada no se guardó ni accedió a datos privados.");
      return;
    }
    if (!userId) throw new Error("Tu sesión expiró. Vuelve a entrar.");
    setSaving(true);
    try {
      await completeOnboarding(getSupabaseBrowserClient(), userId, input);
      await refreshData();
      setShowOnboarding(false);
      notify("Temporada 1 iniciada.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSeasonDraft(input: OnboardingInput) {
    if (reviewMode) {
      const startDate = input.startDate || season.startDate;
      setProfileSettings((current) => ({ ...current, purpose: input.purpose.trim(), onboardingCompleted: false }));
      setSeason({
        id: season.id || "review-season",
        name: input.seasonName.trim() || season.name,
        objective: input.seasonObjective.trim(),
        status: "planned",
        startDate,
        endDate: startDate ? addDaysToIsoDate(startDate, 55) : null,
        week: null,
      });
      setShowOnboarding(false);
      notify("Vista previa: la preparación no se guardó ni accedió a datos privados.");
      return;
    }
    if (!userId) throw new Error("Tu sesión expiró. Vuelve a entrar.");
    setSaving(true);
    try {
      await saveOnboardingDraft(getSupabaseBrowserClient(), userId, input);
      await refreshData();
      setShowOnboarding(false);
      notify("Preparación guardada. La temporada todavía no ha comenzado.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const now = new Date();
      setClientClock({
        today: dateIsoInAppTimeZone(now),
        greeting: greetingForAppTime(now),
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (reviewMode) return;

    const client = getSupabaseBrowserClient();
    let mounted = true;

    void client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const user = data.session?.user;
      setUserId(user?.id ?? "");
      setUserLabel(
        user?.user_metadata?.full_name ||
          user?.email?.split("@")[0] ||
          "Andre",
      );
      setAuthStatus(user ? "signed_in" : "signed_out");
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const user = session?.user;
      setUserId(user?.id ?? "");
      setUserLabel(
        user?.user_metadata?.full_name ||
          user?.email?.split("@")[0] ||
          "Andre",
      );
      setAuthStatus(user ? "signed_in" : "signed_out");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [reviewMode]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function loadRealData() {
      try {
        const client = getSupabaseBrowserClient();
        const data = await loadDashboardData(client, userId);
        if (cancelled) return;

        applyDashboardData(data);
        if (data.season.status === "planned" && !data.profile.onboardingCompleted) {
          setShowOnboarding(true);
        }
        setDataStatus("ready");
      } catch {
        if (!cancelled) setDataStatus("error");
      }
    }

    loadRealData();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function startMission() {
    if (missionStatus === "pending") {
      setMissionStatus("active");
      notify("Misión iniciada. Registra el tiempo real cuando termines.");
    } else if (missionStatus === "active") {
      setModal("study");
    } else {
      notify("Esta misión ya está cumplida.");
    }
  }

  async function toggleTask(id: string) {
    if (reviewMode) {
      notify("Modo revisión: los cambios están bloqueados.");
      return;
    }
    const currentTask = tasks.find((task) => task.id === id);
    if (!currentTask) return;
    const nextState: TaskState = currentTask.state === "done" ? "today" : "done";
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, state: nextState } : task,
      ),
    );
    try {
      await setPlannerItemCompleted(
        getSupabaseBrowserClient(),
        currentTask,
        nextState === "done",
      );
    } catch {
      setTasks((current) =>
        current.map((task) => (task.id === id ? currentTask : task)),
      );
      notify("No se pudo actualizar la tarea.");
    }
  }

  async function saveQuickEntry() {
    if (reviewMode) {
      notify("Modo revisión: no se guardan datos.");
      return;
    }
    if (!userId) {
      notify("Tu sesión expiró. Vuelve a entrar.");
      return;
    }
    if (entryType !== "Pantallas" && entryType !== "Medición" && !note.trim()) {
      notify("Escribe una descripción breve antes de guardar.");
      return;
    }
    if (entryType === "Sesión de estudio" && (!duration || Number(duration) <= 0)) {
      notify("Indica cuánto tiempo estudiaste.");
      return;
    }

    const client = getSupabaseBrowserClient();
    const numberOrNull = (value: string) => value === "" ? null : Number(value);
    setSaving(true);
    try {
      if (entryType === "Tarea" || entryType === "Examen") {
        await createPlannerItem(client, userId, {
          title: note.trim(),
          subject: taskSubject.trim() || "General",
          dueDate: taskDate || null,
          type: entryType,
        });
      } else if (entryType === "Sesión de estudio") {
        await saveStudySession(client, userId, {
          subject: taskSubject.trim() || "General",
          skillName: selectedSkill.name,
          durationMinutes: Number(duration),
          mode: studyMode,
          notes: note.trim(),
        });
      } else if (entryType === "Hábito") {
        const weeklyTarget = Math.max(1, Number(habitForm.weeklyTarget) || Number(targetValue) || 1);
        const frequency = habitForm.frequency === "weekly"
          ? { type: "weekly", target: weeklyTarget, duration_min: numberOrNull(habitForm.durationMin), duration_max: numberOrNull(habitForm.durationMax), start_date: habitForm.startDate || null, schedule: habitForm.schedule.trim() || null }
          : habitForm.frequency === "weekdays"
            ? { type: "weekdays", days: [1, 2, 3, 4, 5], start_date: habitForm.startDate || null, schedule: habitForm.schedule.trim() || null }
            : habitForm.frequency === "continuous_cycle"
              ? { type: "continuous_cycle", target: weeklyTarget, optional_target: habitForm.optional ? weeklyTarget + 1 : null, rotation: habitForm.cycle.split(",").map((item) => item.trim()).filter(Boolean), carry_over: true, duration_min: numberOrNull(habitForm.durationMin), duration_max: numberOrNull(habitForm.durationMax) }
              : { type: "daily", start_date: habitForm.startDate || null, schedule: habitForm.schedule.trim() || null };
        await createHabit(client, userId, {
          title: note.trim(),
          habitType: habitForm.kind === "non_negotiable" ? "non_negotiable" : "habit",
          targetAmount: habitForm.frequency === "daily" || habitForm.frequency === "weekdays" ? Math.max(1, Number(targetValue) || 1) : weeklyTarget,
          unit: unit.trim() || "vez",
          frequency,
          description: habitForm.details,
          difficultDayVersion: habitForm.difficultDay,
          optional: habitForm.optional,
        });
      } else if (entryType === "Meta") {
        await createGoal(client, userId, {
          title: note.trim(),
          currentValue: numberOrNull(numberValue),
          targetValue: numberOrNull(targetValue),
          unit: unit.trim(),
          targetDate: taskDate || null,
          reason: "",
        });
      } else if (entryType === "Medición") {
        await saveBodyMeasurement(client, userId, {
          recordedOn: bodyForm.recordedOn || undefined,
          heightCm: numberOrNull(bodyForm.height),
          weightKg: numberOrNull(bodyForm.weight),
          waistCm: numberOrNull(bodyForm.waist),
          bodyFatPercent: numberOrNull(bodyForm.fat),
          energyLevel: numberOrNull(bodyForm.energy),
          sleepHours: numberOrNull(bodyForm.sleep),
          context: bodyForm.context,
        });
      } else if (entryType === "Pantallas") {
        await saveDigitalWellbeing(client, userId, digitalHabitIds, {
          screenTimeMinutes: numberOrNull(digitalForm.screen),
          socialMediaMinutes: numberOrNull(digitalForm.social),
          shortVideoMinutes: numberOrNull(digitalForm.shortVideo),
          gamingMinutes: numberOrNull(digitalForm.gaming),
          intentionalLeisureMinutes: numberOrNull(digitalForm.leisure),
          stimulationFastMinutes: numberOrNull(digitalForm.fast),
        });
      } else if (entryType === "Diario") {
        await saveJournalEntry(client, userId, note.trim(), Number(mood) || null);
      } else if (entryType === "Actividad") {
        await saveActivityReport(client, userId, {
          description: note.trim(),
          category: activityCategory,
          durationMinutes: duration ? Number(duration) : null,
          result: "",
        });
      }
      await refreshData();
      setModal(null);
      setNote("");
      setTaskDate("");
      setTaskSubject("");
      setNumberValue("");
      setTargetValue("");
      setUnit("");
      setDuration("");
      setHabitForm({ kind: "habit", frequency: "daily", weeklyTarget: "", durationMin: "", durationMax: "", startDate: "", schedule: "", details: "", difficultDay: "", optional: false, cycle: "" });
      notify(`${entryType} guardado correctamente.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function savePlan() {
    if (reviewMode) {
      notify("Modo revisión: no se guardan datos.");
      return;
    }
    if (!planForm.title.trim()) {
      notify("Escribe un nombre para el plan.");
      return;
    }
    setSaving(true);
    try {
      await saveTrackingPlan(getSupabaseBrowserClient(), userId, {
        area: planForm.area as TrackingPlan["area"],
        title: planForm.title,
        status: planForm.status as TrackingPlan["status"],
        startDate: planForm.startDate || null,
        endDate: planForm.endDate || null,
        instructions: planForm.instructions.split("\n").map((item) => item.trim()).filter(Boolean),
        notes: planForm.notes,
      });
      await refreshData();
      setModal(null);
      notify("Plan de observación guardado.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo guardar el plan.");
    } finally {
      setSaving(false);
    }
  }

  async function saveMeal() {
    if (reviewMode) {
      notify("Modo revisión: no se guardan datos.");
      return;
    }
    if (!note.trim()) {
      notify("Describe brevemente lo que comiste.");
      return;
    }
    setSaving(true);
    try {
      await saveMealLog(getSupabaseBrowserClient(), userId, {
        mealType,
        description: note,
        observation: mealObservation,
      });
      await refreshData();
      setNote("");
      setMealObservation("");
      setModal(null);
      notify("Alimentación registrada sin contar calorías.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo guardar la comida.");
    } finally {
      setSaving(false);
    }
  }

  function prepareNutritionHabit(title = "", unitName = "vez") {
    setEntryType("Hábito");
    setNote(title);
    setTargetValue("1");
    setUnit(unitName);
    setModal("quick");
  }

  async function toggleTrackedHabit(habit: HabitOverview) {
    if (reviewMode) {
      notify("Modo revisión: los cambios están bloqueados.");
      return;
    }
    if (!userId) return;
    try {
      await setHabitCheckin(
        getSupabaseBrowserClient(),
        userId,
        habit.id,
        !habit.week.at(-1),
      );
      await refreshData();
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo guardar el hábito.");
    }
  }

  function selectAttribute(group: AttributeGroup) {
    setActiveAttribute(group.name);
    setSelectedSkillName(group.skills[0].name);
  }

  async function saveJournal() {
    if (reviewMode) {
      notify("Modo revisión: no se guardan datos.");
      return;
    }
    if (!note.trim()) {
      notify("Escribe primero una reflexión breve.");
      return;
    }
    setSaving(true);
    try {
      await saveJournalEntry(getSupabaseBrowserClient(), userId, note.trim(), Number(mood) || null);
      await refreshData();
      setNote("");
      notify("Reflexión guardada en Supabase.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo guardar la reflexión.");
    } finally {
      setSaving(false);
    }
  }

  async function finishMission(result: string, index: number) {
    if (reviewMode) {
      notify("Modo revisión: no se guardan datos.");
      return;
    }
    if (!primaryTask) return;
    if (!duration || Number(duration) <= 0) {
      notify("Indica la duración real antes de completar la misión.");
      return;
    }
    setSaving(true);
    try {
      await saveStudySession(getSupabaseBrowserClient(), userId, {
        subject: primaryTask.subject,
        skillName: selectedSkill.name,
        durationMinutes: Number(duration),
        mode: index === 3 ? "simulation" : index === 2 ? "independent" : index === 0 ? "guided" : "practice",
        notes: result,
      });
      await setPlannerItemCompleted(getSupabaseBrowserClient(), primaryTask, true);
      await refreshData();
      setMissionStatus("done");
      setModal(null);
      setDuration("");
      notify("Misión y práctica reportada guardadas.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo cerrar la misión.");
    } finally {
      setSaving(false);
    }
  }

  async function closeDay() {
    if (reviewMode) {
      notify("Modo revisión: no se guardan datos.");
      return;
    }
    setSaving(true);
    try {
      const summary = note.trim() || `Cierre del día: ${completedHabits} de ${activeMinimumItems.length} no negociables.`;
      await saveJournalEntry(getSupabaseBrowserClient(), userId, summary, Number(mood) || null);
      await refreshData();
      setModal(null);
      setNote("");
      notify("Día cerrado y guardado.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo cerrar el día.");
    } finally {
      setSaving(false);
    }
  }

  async function activateRecovery() {
    if (reviewMode) {
      notify("Modo revisión: no se guardan datos.");
      return;
    }
    setSaving(true);
    try {
      const today = dateIsoInAppTimeZone();
      await createPlannerItem(getSupabaseBrowserClient(), userId, {
        title: activeMinimumItems.length
          ? `Retomar con un mínimo: ${activeMinimumItems.map((item) => item.title).join(", ")}`
          : "Elegir una acción pequeña para retomar el ritmo",
        subject: "Recuperación",
        dueDate: today,
        type: "Tarea",
      });
      await refreshData();
      setModal(null);
      setNote("");
      notify("Plan mínimo creado como misión real de hoy.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo activar la recuperación.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    if (reviewMode) {
      window.location.href = window.location.origin;
      return;
    }
    await getSupabaseBrowserClient().auth.signOut();
  }

  if (!reviewMode && authStatus !== "signed_in") {
    return <AuthScreen loading={authStatus === "checking"} />;
  }

  return (
    <main className={reviewMode ? "app-shell app-shell--review" : "app-shell"}>
      <aside className="sidebar">
        <div className="brand">
          <BrandMark />
          <div>
            <span>Proyecto personal</span>
            <strong>Temporada Uno</strong>
          </div>
        </div>

        <nav className="main-nav" aria-label="Navegación principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={view === item.id ? "nav-item nav-item--active" : "nav-item"}
                onClick={() => setView(item.id)}
              >
                <span className="nav-item__icon"><Icon aria-hidden="true" size={19} strokeWidth={1.8} /></span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar__season">
          <div className="season-route" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p>La ruta actual</p>
          <strong>El despertar</strong>
          <small>{season.status === "active" && season.week ? `Semana ${season.week} de 8` : "En preparación"}</small>
        </div>

        <button className={view === "system" ? "profile-chip profile-chip--active" : "profile-chip"} type="button" onClick={() => setView("system")} aria-label="Abrir Sistema y perfil">
          <span className="profile-chip__avatar">
            {(reviewMode ? "R" : userLabel.charAt(0)).toUpperCase()}
          </span>
          <div>
            <strong>{reviewMode ? "Revisión" : userLabel}</strong>
            <small>{reviewMode ? "Solo lectura" : "Sistema y perfil"}</small>
          </div>
          <Settings2 aria-hidden="true" size={16} />
        </button>
      </aside>

      <section className="workspace">
        {reviewMode && (
          <div className="review-banner" role="status">
            <span><Eye aria-hidden="true" size={17} strokeWidth={1.8} /></span>
            <div><strong>Modo revisión</strong><small>Sin acceso a datos privados · solo lectura</small></div>
            <button onClick={signOut} type="button">Cerrar revisión</button>
          </div>
        )}
        <header className="topbar">
          <div>
            <p className="eyebrow">{currentDateLabel}</p>
            <h1 className={view === "today" ? "topbar__greeting" : undefined}>
              {view === "today" && `${greetingLabel}, ${reviewMode ? "Andre" : userLabel}`}
              {view === "studies" && "Planificador"}
              {view === "progress" && "Mapa de progreso"}
              {view === "goals" && "Metas"}
              {view === "habits" && "Hábitos"}
              {view === "nutrition" && "Nutrición"}
              {view === "dopamine" && "Atención"}
              {view === "journal" && "Diario"}
              {view === "system" && "Sistema"}
            </h1>
          </div>
          <div className="player-status">
            <span className="mobile-season-status">{season.status === "active" ? `Semana ${season.week ?? "—"}` : "En preparación"}</span>
            {dataStatus === "error" && <span className="data-status data-status--error">Sin conexión</span>}
            <div className="season-pill">{seasonLabel}</div>
            <div className="level-badge">◇</div>
            <div className="xp-summary">
              <span>XP de esfuerzo</span>
              <strong>{totalXp} XP</strong>
              <small>Niveles por definir</small>
            </div>
            <button className="sign-out system-shortcut" onClick={() => setView("system")} type="button" aria-label="Abrir Sistema"><Settings2 size={16} /></button>
            {!reviewMode && <button className="sign-out" onClick={signOut} type="button">Cerrar sesión</button>}
          </div>
        </header>

        {view === "today" && (
          <div className="dashboard">
            {season.status === "planned" && (
              <section className="season-setup-callout panel">
                <div>
                  <p className="eyebrow">Temporada en preparación</p>
                  <h2>Tu Semana 1 comienza cuando tú lo confirmes.</h2>
                  <p>Elige hasta tres no negociables y registra solo las líneas base que ya conozcas. Todo lo demás puede quedar vacío.</p>
                </div>
                <button className="primary-action" type="button" onClick={() => setShowOnboarding(true)}>
                  Configurar Temporada 1 <ArrowRight size={17} />
                </button>
              </section>
            )}
            <section className="mission-card panel">
              <div className="mission-map" aria-hidden="true">
                <span className="route route--one" />
                <span className="route route--two" />
                <span className="waypoint waypoint--one">◆</span>
                <span className="waypoint waypoint--two">◉</span>
              </div>
              <div className="mission-card__content">
                <p className="eyebrow">Misión principal</p>
                <span className="mission-glyph"><FlagTriangleRight aria-hidden="true" size={27} strokeWidth={1.6} /></span>
                <h2>
                  {primaryTask ? (
                    <>{primaryTask.subject}:<br />{primaryTask.title}</>
                  ) : (
                    <>Elige tu primera<br />misión real</>
                  )}
                </h2>
                <p className="mission-copy">
                  {primaryTask
                    ? `Vence: ${formatTaskDate(primaryTask.dueDate, primaryTask.state)}. Al terminar, registra el resultado.`
                    : "Añade una tarea o examen y aparecerá aquí como tu siguiente movimiento."}
                </p>
                {primaryTask && <div className="mission-meta">
                  <span><Clock3 aria-hidden="true" /> <strong>Duración por registrar</strong></span>
                  <span><Sparkles aria-hidden="true" /> <strong>Reporte honesto</strong></span>
                </div>}
                <button
                  className={`primary-action ${
                    missionStatus === "active" ? "primary-action--active" : ""
                  }`}
                  onClick={() => {
                    if (primaryTask) {
                      startMission();
                    } else {
                      setEntryType("Tarea");
                      setModal("quick");
                    }
                  }}
                >
                  {!primaryTask && "Registrar primera misión"}
                  {primaryTask && missionStatus === "pending" && "Iniciar misión"}
                  {primaryTask && missionStatus === "active" && "Finalizar misión"}
                  {primaryTask && missionStatus === "done" && "Misión cumplida"}
                  <ArrowRight aria-hidden="true" size={22} />
                </button>
              </div>
            </section>

            <aside className="today-rail">
              <section className="evaluation-card panel">
                <div className="card-icon"><CalendarClock aria-hidden="true" size={31} strokeWidth={1.5} /></div>
                <div>
                  <p className="eyebrow">Próxima evaluación</p>
                  <h3>{nextExam?.title ?? "Sin examen registrado"}</h3>
                  <p className="evaluation-date">
                    <Sparkles aria-hidden="true" size={14} /> {nextExam
                      ? `${nextExam.subject} · ${formatTaskDate(nextExam.dueDate, nextExam.state)}`
                      : "Añádelo en el Planificador"}
                  </p>
                  {nextExam ? <><div className="preparation-row"><span>Ruta de preparación</span><strong>0 de 5 fases registradas</strong></div><ProgressBar value={0} accent="var(--gold)" small /></> : <div className="uncalculated-bar"><span>Sin ruta de preparación</span></div>}
                </div>
              </section>

              <section className="minimums-card panel">
                <div className="section-heading">
                  <div>
                  <p className="eyebrow">Identidad protegida</p>
                  <h3>No negociables de hoy</h3>
                  </div>
                  <span>{completedHabits}/{activeMinimumItems.length}</span>
                </div>
                <div className="minimum-list">
                  {activeMinimumItems.map((item) => {
                    const done = item.week.at(-1) === true;
                    return (
                      <button
                        key={item.id}
                        className={done ? "minimum minimum--done" : "minimum"}
                        onClick={() => toggleTrackedHabit(item)}
                      >
                        <span className="minimum__icon"><Sparkles aria-hidden="true" size={18} strokeWidth={1.8} /></span>
                        <span><strong>{item.title}</strong><small>{item.difficultDayVersion || item.description || item.goal}</small></span>
                        <i>{done ? "✓" : ""}</i>
                      </button>
                    );
                  })}
                </div>
                <button className="minimum-recovery" onClick={() => setModal("recovery")}>
                  ¿Día difícil? Activar plan mínimo <span>→</span>
                </button>
              </section>
            </aside>

            <button className="quick-card panel" onClick={() => setModal("quick")}>
              <span className="quick-card__icon"><PenLine aria-hidden="true" size={22} /></span>
              <span>
                <small>Captura rápida</small>
                <strong>Registrar algo</strong>
              </span>
              <i><ArrowRight aria-hidden="true" size={19} /></i>
            </button>
            <button className="close-day panel" onClick={() => setModal("close")}>
              <span><MoonStar aria-hidden="true" size={24} /></span>
              <strong>Cerrar el día</strong>
              <small>2 min</small>
            </button>
          </div>
        )}

        {view === "studies" && (
          <div className="content-view">
            <section className="planner-header panel">
              <div>
                <p className="eyebrow">Estudios</p>
                <h2>Tu ruta académica.</h2>
                <p>Tareas, exámenes y prácticas con fecha y siguiente paso.</p>
              </div>
              <div className="planner-actions">
                <button className="secondary-action" onClick={() => setModal("quick")}>
                  + Registrar
                </button>
              </div>
            </section>

            <section className="week-strip panel" aria-label="Resumen semanal">
              {plannerDays.map(({ iso, day, date, count, active }) => (
                <button
                  key={`${day}-${date}`}
                  className={active ? "week-day week-day--active" : "week-day"}
                  onClick={() => { setEntryType("Tarea"); setTaskDate(iso); setModal("quick"); }}
                >
                  <small>{day}</small>
                  <strong>{date}</strong>
                  <span>{count || "—"}</span>
                </button>
              ))}
            </section>

            <section className="task-board">
              {([
                ["today", "Hoy", "Lo que mueve el día"],
                ["upcoming", "Próximas", "Con fecha definida"],
                ["done", "Completadas", "Progreso real"],
              ] as [TaskState, string, string][]).map(([state, title, subtitle]) => {
                const columnTasks = tasks.filter((task) => task.state === state);
                return (
                  <div className="task-column panel" key={state}>
                    <div className="task-column__head">
                      <div>
                        <h3>{title}</h3>
                        <small>{subtitle}</small>
                      </div>
                      <span>{columnTasks.length}</span>
                    </div>
                    <div className="task-list">
                      {columnTasks.map((task) => (
                        <article
                          className={`task-item ${state === "done" ? "task-item--done" : ""}`}
                          key={task.id}
                        >
                          <button
                            className="task-check"
                            onClick={() => toggleTask(task.id)}
                            aria-label={
                              state === "done"
                                ? `Reabrir ${task.title}`
                                : `Completar ${task.title}`
                            }
                          >
                            {state === "done" ? "✓" : ""}
                          </button>
                          <div>
                            <span className={`task-type task-type--${task.type.toLowerCase()}`}>
                              {task.type}
                            </span>
                            <h4>{task.title}</h4>
                            <p>{task.subject}</p>
                            <small>{formatTaskDate(task.dueDate, task.state)}</small>
                          </div>
                        </article>
                      ))}
                      {columnTasks.length === 0 && (
                        <div className="empty-task">No hay elementos aquí.</div>
                      )}
                    </div>
                    {state === "today" && (
                      <button className="add-row" onClick={() => setModal("quick")}>
                        + Añadir tarea
                      </button>
                    )}
                  </div>
                );
              })}
            </section>

            <section className="subject-grid">
              {subjectData.map((subject) => (
                <article className="subject-card panel" key={subject.name}>
                  <div className="subject-card__top">
                    <span className="subject-rune" style={{ color: "#8fa9d7" }}>
                      ◆
                    </span>
                    <span className="tag">
                      {subject.status === "passed"
                        ? "Aprobada"
                        : subject.status === "studying"
                          ? "En curso"
                          : subject.status === "failed"
                            ? "Por repetir"
                            : "Planificada"}
                    </span>
                  </div>
                  <h3>{subject.name}</h3>
                  <p>{subject.status === "pending" && subject.pendingItems === 0 ? "Sin actividad registrada" : `${subject.nextItem} · ${subject.pendingItems} pendientes`}</p>
                  {subject.status !== "pending" || subject.pendingItems > 0 ? <>
                    <div className="subject-card__progress">
                      <span>Preparación registrada</span>
                      <strong>{subject.progress}%</strong>
                    </div>
                    <ProgressBar value={subject.progress} accent="#8fa9d7" small />
                  </> : <small>Se activará cuando comience el semestre.</small>}
                  <button onClick={() => { setEntryType("Tarea"); setTaskSubject(subject.name); setModal("quick"); }}>
                    Añadir pendiente <span>→</span>
                  </button>
                </article>
              ))}
              {subjectData.length === 0 && (
                <article className="empty-state panel">
                  <strong>Sin materias</strong>
                  <p>Crea una al registrar tu primera tarea o examen.</p>
                  <button className="secondary-action" onClick={() => { setEntryType("Tarea"); setModal("quick"); }}>Registrar</button>
                </article>
              )}
            </section>

            {nextExam && <section className="path-card panel">
              <div className="path-card__heading">
                <div>
                  <p className="eyebrow">{nextExam.subject} · {nextExam.title}</p>
                  <h3>Ruta de preparación</h3>
                </div>
                <span>0 de 5 fases</span>
              </div>
              <div className="phase-path">
                {phases.map((phase, index) => (
                  <div className={`phase phase--${phase.state}`} key={phase.label}>
                    <span>{phase.state === "done" ? "✓" : index + 1}</span>
                    <strong>{phase.label}</strong>
                    <small>
                      {phase.state === "done"
                        ? "Completado"
                        : phase.state === "active"
                          ? "Misión de hoy"
                          : "Pendiente"}
                    </small>
                  </div>
                ))}
              </div>
            </section>}
          </div>
        )}

        {view === "progress" && (
          <div className="content-view skills-view">
            <section className="skill-overview panel">
              <div>
                <p className="eyebrow">Tu personaje · vista completa</p>
                <h2>Tu vida no es una sola barra.</h2>
                <p>
                  Primero miramos tu estado general; después, el avance de tu
                  carrera y las habilidades concretas que estás entrenando.
                </p>
              </div>
              <div className="overview-level">
                <span>{totalXp}</span>
                <div>
                  <small>XP de esfuerzo registrado</small>
                  <strong>{storedSkills.length} habilidades con evidencia</strong>
                </div>
              </div>
            </section>

            <div className="progress-tabs" role="tablist" aria-label="Secciones de progreso">
              <button className={progressTab === "general" ? "is-active" : ""} onClick={() => setProgressTab("general")}>General</button>
              <button className={progressTab === "career" ? "is-active" : ""} onClick={() => setProgressTab("career")}>Carrera</button>
              <button className={progressTab === "skills" ? "is-active" : ""} onClick={() => setProgressTab("skills")}>Habilidades</button>
            </div>

            {progressTab === "general" && <>
            <section className="purpose-card panel">
              <span className="purpose-card__compass">✦</span>
              <div>
                <p className="eyebrow">Disciplina</p>
                <h3>La disciplina de hoy evita el arrepentimiento de mañana.</h3>
                <p>{profileSettings.purpose || "Tu brújula personal está por definir en Sistema."}</p>
              </div>
            </section>

            <section className="life-state panel">
              <div className="section-heading life-state__heading">
                <div>
                  <p className="eyebrow">Barras generales</p>
                  <h3>Estado de tu vida</h3>
                </div>
                <span>Últimos 28 días disponibles</span>
              </div>
              <p className="section-copy">
                Estas barras se calcularán con hábitos, tareas, sesiones y registros
                reales; no con una opinión al azar.
              </p>
              <div className="life-stat-grid">
                {realLifeStats.map((stat) => (
                  <article className="life-stat" key={stat.name}>
                    <div className="life-stat__head">
                      <div>
                        <strong>{stat.name}</strong>
                        <small>{stat.detail}</small>
                      </div>
                      <span style={{ color: stat.color }}>{stat.value == null ? "—" : `${stat.value}%`}</span>
                    </div>
                    {stat.value == null ? <div className="uncalculated-bar"><span>Aún no calculado</span></div> : <ProgressBar value={stat.value} accent={stat.color} />}
                    <p>{stat.change}</p>
                  </article>
                ))}
              </div>
            </section>
            </>}

            {progressTab === "career" && <section className="career-progress panel">
              <div className="career-progress__main">
                <p className="eyebrow">Objetivo profesional</p>
                <h3>Licenciatura en Ciencia de Datos</h3>
                <p>
                  La barra de carrera sube al aprobar materias. Las habilidades
                  técnicas suben con evidencia, aunque todavía no termine el semestre.
                </p>
                <div className="degree-bar">
                  <div>
                    <span>Avance del pénsum</span>
                    <strong>{realLifeStats[3].value == null ? "Sin datos" : `${realLifeStats[3].value}%`}</strong>
                  </div>
                  {realLifeStats[3].value != null && <ProgressBar value={realLifeStats[3].value} accent="#9a8cc2" />}
                  <small>{subjectData.length ? `${subjectData.filter((subject) => subject.status === "passed").length} aprobadas · ${subjectData.filter((subject) => subject.status === "studying").length} cursando · ${subjectData.filter((subject) => subject.status === "pending").length} pendientes` : "Registra tu pénsum para calcular el avance académico."}</small>
                </div>
              </div>
              <div className="term-card">
                <span>Periodo actual</span>
                <strong>{subjectData.filter((subject) => subject.status === "studying").length} materias</strong>
                <div><small>Sin pendientes</small><b>{subjectData.filter((subject) => subject.status === "studying" && subject.pendingItems === 0).length}</b></div>
                <div><small>Con pendientes</small><b className="warning-text">{subjectData.filter((subject) => subject.status === "studying" && subject.pendingItems > 0).length}</b></div>
                <div><small>Próxima evaluación</small><b>{nextExam ? formatTaskDate(nextExam.dueDate, nextExam.state) : "Ninguna"}</b></div>
              </div>
            </section>}

            {progressTab === "skills" && <>
            <div className="subsection-title">
              <div>
                <p className="eyebrow">Subbarras entrenables</p>
                <h2>Habilidades y caminos</h2>
              </div>
              <p>
                Elige un camino para ver exactamente qué estás mejorando y con qué evidencia.
              </p>
            </div>

            <section className="attribute-tabs" aria-label="Caminos de habilidades">
              {realAttributeGroups.map((group) => (
                <button
                  key={group.name}
                  className={
                    activeAttribute === group.name
                      ? "attribute-tab attribute-tab--active"
                      : "attribute-tab"
                  }
                  onClick={() => selectAttribute(group)}
                  style={{ "--attribute-color": group.color } as React.CSSProperties}
                >
                  <span>{group.icon}</span>
                  <div>
                    <small>Camino</small>
                    <strong>{group.name}</strong>
                  </div>
                  <i>{group.level == null ? "Sin datos" : `${group.level}%`}</i>
                </button>
              ))}
            </section>

            <section className="skill-workbench">
              <div className="skill-group panel">
                <div className="skill-group__head">
                  <div>
                    <p className="eyebrow" style={{ color: activeGroup.color }}>
                      {activeGroup.level == null ? "Dominio por registrar" : `Dominio medio ${activeGroup.level}%`}
                    </p>
                    <h3>{activeGroup.name}</h3>
                    <p>{activeGroup.description}</p>
                  </div>
                  <span
                    className="attribute-emblem"
                    style={{ borderColor: activeGroup.color, color: activeGroup.color }}
                  >
                    {activeGroup.icon}
                  </span>
                </div>
                <div className="skill-list">
                  {activeGroup.skills.map((skill) => (
                    <SkillCard
                      key={skill.name}
                      skill={skill}
                      color={activeGroup.color}
                      selected={selectedSkill.name === skill.name}
                      onSelect={() => setSelectedSkillName(skill.name)}
                    />
                  ))}
                </div>
              </div>

              <aside className="skill-detail panel">
                <p className="eyebrow">Habilidad seleccionada</p>
                <div className="skill-detail__title">
                  <span style={{ borderColor: activeGroup.color, color: activeGroup.color }}>
                    {selectedSkill.mastery == null ? "—" : `${Math.round(selectedSkill.mastery)}%`}
                  </span>
                  <div>
                    <h3>{selectedSkill.name}</h3>
                    <small>{selectedSkill.mastery == null ? "Dominio por registrar" : "Dominio reportado"}</small>
                  </div>
                </div>
                <div className="skill-detail__xp">
                  <div>
                    <span>Esfuerzo acumulado</span>
                    <strong>{selectedSkill.xp} XP</strong>
                  </div>
                  {selectedSkill.mastery == null ? <div className="uncalculated-bar"><span>Aún no calculado</span></div> : <ProgressBar value={selectedSkill.mastery} accent={activeGroup.color} />}
                </div>
                <div className="evidence-box">
                  <small>Evidencia registrada</small>
                  <strong>{selectedSkill.evidence}</strong>
                </div>
                <div className="next-unlock">
                  <small>Próxima mejora</small>
                  <p>{selectedSkill.focus}</p>
                </div>
                <button
                  className="secondary-action full-button"
                  onClick={() => {
                    setEntryType("Sesión de estudio");
                    setModal("quick");
                  }}
                >
                  + Registrar práctica
                </button>
              </aside>
            </section>

            <section className="measurement panel">
              <div className="measurement__icon">?</div>
              <div>
                <p className="eyebrow">Cómo se calcula</p>
                <h3>El esfuerzo no es lo mismo que el dominio.</h3>
                <p>
                  Las prácticas reportadas construyen historial de esfuerzo. El dominio
                  evoluciona gradualmente con ejercicios, proyectos, simulacros y resultados
                  que comuniques. No necesitas adjuntar comprobantes.
                </p>
              </div>
            </section>
            </>}
          </div>
        )}

        {view === "goals" && (
          <div className="content-view goals-view">
            <section className="goals-hero panel">
              <div>
                <p className="eyebrow">Dirección</p>
                <h2>Define el resultado. Construye el camino.</h2>
                <p>Línea base, objetivo, fecha y siguiente paso.</p>
              </div>
              <button className="secondary-action" onClick={() => { setEntryType("Meta"); setModal("quick"); }}>
                + Nueva meta
              </button>
            </section>

            <section className={goalData.length === 0 ? "goal-grid goal-grid--empty" : "goal-grid"}>
              {goalData.map((goal) => (
                <article className="goal-card panel" key={goal.title}>
                  <div className="goal-card__top">
                    <span style={{ color: "#d3ac66" }}>◎</span>
                    <small>Meta real</small>
                    <b>Por calcular</b>
                  </div>
                  <h3>{goal.title}</h3>
                  <div className="goal-values">
                    <div><small>Situación actual</small><strong>{goal.currentValue ?? "Por registrar"} {goal.currentValue == null ? "" : goal.unit}</strong></div>
                    <span>→</span>
                    <div><small>Resultado</small><strong>{goal.targetValue ?? "Por definir"} {goal.targetValue == null ? "" : goal.unit}</strong></div>
                  </div>
                  <div className="uncalculated-bar"><span>Registra avances para construir la tendencia</span></div>
                  <div className="goal-next"><small>Razón</small><p>{goal.reason || "Añade evidencia para construir el plan y medir el avance."}</p></div>
                  <footer>
                    <span>◷ {goal.targetDate ?? "Sin fecha"}</span>
                    <button onClick={() => { setEntryType("Tarea"); setTaskSubject("Meta personal"); setNote(`Siguiente paso: ${goal.title}`); setModal("quick"); }}>Crear siguiente paso →</button>
                  </footer>
                </article>
              ))}
              {goalData.length === 0 && (
                <article className="empty-state panel">
                  <strong>Metas: 0</strong>
                  <p>No inventamos progreso. Crea una meta con línea base, resultado y fecha.</p>
                  <button className="secondary-action" onClick={() => { setEntryType("Meta"); setModal("quick"); }}>Crear primera meta</button>
                </article>
              )}
            </section>

            <section className="physical-evolution panel">
              <div className="physical-evolution__copy">
                <p className="eyebrow">Físico · apariencia y salud</p>
                <h3>Composición corporal sin convertir tu cuerpo en una nota.</h3>
                <p>
                  La apariencia se observa con resultados controlables: medidas, postura,
                  cuidado, fuerza y constancia. Si eliges 12% como meta futura, primero necesita una línea base, recuperación suficiente y un plazo responsable.
                </p>
                <button className="ghost-action" onClick={() => { setEntryType("Medición"); setModal("quick"); }}>
                  + Registrar medición
                </button>
              </div>
              <div className="metric-grid">
                {realBodyMetrics.map((metric) => (
                  <article key={metric.label}>
                    <small>{metric.label}</small><strong>{metric.value}</strong><span>{metric.trend}</span>
                  </article>
                ))}
              </div>
              <div className="body-trend">
                <div className="body-trend__head"><span>Evolución mensual</span><small>Se activará con tus mediciones</small></div>
                <div className="body-trend__chart">
                  {Array.from({ length: 8 }, (_, index) => <i key={index} style={{ height: "2%" }} />)}
                </div>
              </div>
            </section>

            <section className="season-and-rewards">
              <article className="season-card panel">
                <p className="eyebrow">Temporada 1 · 8 semanas</p>
                <div className="season-card__title">
                  <div><h3>El despertar</h3><p>Recuperar dominio en estudios, cuerpo y rutina.</p></div>
                  <span>{season.week ? `${season.week}/8` : "En preparación"}</span>
                </div>
                {season.week && <ProgressBar value={(season.week / 8) * 100} accent="var(--gold)" />}
                <div className="season-bosses">
                  <div><span>Jefe académico</span><strong>{nextExam?.title ?? "Por definir"}</strong><small>{nextExam ? formatTaskDate(nextExam.dueDate, nextExam.state) : "Sin examen"}</small></div>
                  <div><span>Desafío físico</span><strong>Por definir</strong><small>Sin resultado registrado</small></div>
                  <div><span>Desafío de carácter</span><strong>7 cierres diarios</strong><small>{journalData.length} registrados</small></div>
                </div>
              </article>
              <article className="rewards-card panel">
                <div className="rewards-card__head"><div><p className="eyebrow">Recompensas</p><h3>Botín ganado</h3></div><span>◇ {coins}</span></div>
                <div className="reward-list">
                  <button disabled><span>☕</span><div><strong>Salida o comida especial</strong><small>Condición por definir contigo</small></div><i>Pendiente</i></button>
                  <button disabled><span>✦</span><div><strong>Título: Aprendiz constante</strong><small>Condición por definir contigo</small></div><i>Pendiente</i></button>
                  <button disabled><span>◈</span><div><strong>Ocio especial planificado</strong><small>Condición por definir contigo</small></div><i>Pendiente</i></button>
                </div>
              </article>
            </section>

            <section className="review-recovery">
              <article className="review-card panel">
                <div><p className="eyebrow">Revisión semanal · domingo</p><h3>Mirar, aprender y ajustar.</h3><p>Compara metas, hábitos, energía y resultados. Después elige una mejora concreta.</p></div>
                <div className="review-score"><span>{weeklyRate == null ? "—" : `${weeklyRate}%`}</span><small>{weeklyRate == null ? "Sin datos suficientes" : "semana actual"}</small></div>
                <button onClick={() => { setView("journal"); setEntryType("Diario"); }}>Iniciar revisión →</button>
              </article>
              <article className="recovery-card panel">
                <span className="recovery-card__icon">↺</span>
                <div><p className="eyebrow">Modo recuperación</p><h3>Una mala semana no borra la temporada.</h3><p>Reduce la carga, protege los no negociables y crea una misión de regreso.</p></div>
                <button className="ghost-action" onClick={() => setModal("recovery")}>Activar modo</button>
              </article>
            </section>
          </div>
        )}

        {view === "habits" && (
          <div className="content-view habits-view">
            <section className="habits-hero panel">
              <div>
                <p className="eyebrow">Conducta repetida · progreso visible</p>
                <h2>Lo que repites termina formando al personaje.</h2>
                <p>
                  Aquí no solo marcas hábitos: comparas semanas, encuentras caídas
                  y descubres si la constancia realmente está mejorando.
                </p>
              </div>
              <div className="habit-score">
                <span>{weeklyRate == null ? "—" : `${weeklyRate}%`}</span>
                <small>cumplimiento semanal</small>
                <b>{weeklyPossible ? `${completedThisWeek} registros` : "Sin datos"}</b>
              </div>
            </section>

            <section className="habit-summary-grid">
              <article className="habit-kpi panel">
                <small>Racha más fuerte</small>
                <strong>{strongestHabit?.streak == null ? "Sin datos" : `${strongestHabit.streak} días`}</strong>
                <span>{strongestHabit?.title ?? "Sin registros"}</span>
              </article>
              <article className="habit-kpi panel">
                <small>Esta semana</small>
                <strong>{weeklyPossible ? `${completedThisWeek} / ${weeklyPossible}` : "Sin datos"}</strong>
                <span>{weeklyPossible ? "registros reportados" : "Empieza con un registro"}</span>
              </article>
              <article className="habit-kpi panel">
                <small>Mayor oportunidad</small>
                <strong>{weakestHabit?.title ?? "Sin datos"}</strong>
                <span>{weakestHabit?.rate == null ? "Aún no calculado" : `${weakestHabit.rate}% en días registrados`}</span>
              </article>
              <article className="habit-kpi panel">
                <small>Recuperaciones</small>
                <strong>0</strong>
                <span>aún sin registrar</span>
              </article>
            </section>

            <section className="habit-analytics">
              <article className="trend-card panel">
                <div className="chart-heading">
                  <div>
                    <p className="eyebrow">Tendencia</p>
                    <h3>Cumplimiento diario</h3>
                  </div>
                  <div className="period-tabs">
                    <button className={habitPeriod === 7 ? "period-tabs__active" : ""} onClick={() => setHabitPeriod(7)}>7 días</button>
                    <button className={habitPeriod === 28 ? "period-tabs__active" : ""} onClick={() => setHabitPeriod(28)}>4 semanas</button>
                    <button disabled>3 meses</button>
                  </div>
                </div>
                {weeklyRate == null ? <div className="chart-empty"><strong>Aún no calculado</strong><small>Registra al menos siete oportunidades antes de mostrar porcentajes.</small></div> : <div className="bar-chart" aria-label="Tendencia de cumplimiento de hábitos">
                  {heatmapData.slice(-habitPeriod).map((count, index) => {
                    const value = habitData.length ? Math.round((count / habitData.length) * 100) : 0;
                    return (
                    <div className="bar-chart__column" key={`${value}-${index}`}>
                      <span style={{ height: `${value}%` }} />
                      <small>{index % 2 === 0 ? index + 1 : ""}</small>
                    </div>
                  );})}
                </div>}
                <div className="chart-note">
                  <span><i className="legend-dot" /> Cumplimiento</span>
                  <strong>{weeklyRate == null ? "Promedio: sin datos" : `Promedio: ${weeklyRate}%`}</strong>
                </div>
              </article>

              <article className="heatmap-card panel">
                <div className="chart-heading">
                  <div>
                    <p className="eyebrow">Mapa de constancia</p>
                    <h3>Últimos 28 días</h3>
                  </div>
                  <span className="small-badge">Datos reales</span>
                </div>
                {habitData.some((habit) => habit.recordedDays > 0) ? <div className="habit-heatmap" aria-label="Actividad de los últimos 28 días">
                  {heatmapData.map((count, index) => {
                    const intensity = Math.min(3, count);
                    return (
                    <button
                      key={index}
                      className={`heat-cell heat-cell--${intensity}`}
                      aria-label={`Día ${index + 1}: intensidad ${intensity}`}
                      onClick={() => notify(`Día ${index + 1}: ${count} hábitos cumplidos.`)}
                    />
                  );})}
                </div> : <div className="chart-empty"><strong>Sin datos</strong><small>El mapa aparecerá con tu primer registro.</small></div>}
                {habitData.some((habit) => habit.recordedDays > 0) && <div className="heatmap-legend">
                  <span>Menos</span>
                  {[0, 1, 2, 3].map((level) => (
                    <i className={`heat-cell heat-cell--${level}`} key={level} />
                  ))}
                  <span>Más</span>
                </div>}
                <p>
                  El análisis aparecerá cuando existan suficientes registros. No se mostrarán conclusiones inventadas.
                </p>
              </article>
            </section>

            <section className="non-negotiables panel">
              <div className="section-heading">
                <div><p className="eyebrow">Base del personaje</p><h3>No negociables</h3></div>
                <span>Modo normal</span>
              </div>
              <p className="section-copy">
                Son el mínimo que protege tu identidad cuando el día se complica.
                Si se abandonan por decisión, aparece una misión de recuperación.
              </p>
              <div className="non-negotiable-grid">
                {habitData.filter((habit) => habit.habitType === "non_negotiable").map((item) => (
                  <article key={item.id}>
                    <div><span>◆</span><strong>{item.title}</strong><b>{item.rate == null ? "—" : `${item.rate}%`}</b></div>
                    <small>{item.difficultDayVersion ? `Día difícil: ${item.difficultDayVersion}` : habitFrequencyLabel(item)}</small>
                    <p>{item.streak == null ? "Todavía sin datos." : `Racha actual: ${item.streak} días.`}</p>
                    {item.rate == null ? <div className="uncalculated-bar"><span>Aún no calculado</span></div> : <ProgressBar value={item.rate} accent={item.rate < 75 ? "#b98275" : "#d3ac66"} small />}
                  </article>
                ))}
                {habitData.filter((habit) => habit.habitType === "non_negotiable").length === 0 && <div className="empty-inline"><strong>Sin no negociables activos</strong><small>Puedes elegir hasta tres desde Sistema.</small></div>}
              </div>
              <button className="minimum-recovery" onClick={() => setModal("recovery")}>
                Configurar modo de día difícil <span>→</span>
              </button>
            </section>

            <section className="habit-table panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Hábitos activos</p>
                  <h3>Detalle por hábito</h3>
                </div>
                <button
                  className="secondary-action"
                  onClick={() => {
                    setEntryType("Hábito");
                    setModal("quick");
                  }}
                >
                  + Nuevo hábito
                </button>
              </div>
              <div className="habit-table__head">
                <span>Hábito</span><span>Meta</span><span>Últimos 7 días</span><span>Racha</span><span>30 días</span>
              </div>
              {habitData.map((habit) => (
                <article className="habit-row" key={habit.id}>
                  <strong>{habit.title}</strong>
                  <span>{habitFrequencyLabel(habit)}{habit.optional && habit.frequency.type !== "continuous_cycle" ? " · opcional" : ""}</span>
                  <div className="week-dots" aria-label={`Últimos 7 días de ${habit.title}`}>
                    {habit.week.map((done, index) => (
                      <i className={done === null ? "week-dot week-dot--unknown" : done ? "week-dot week-dot--done" : "week-dot"} key={index}>
                        {done === true ? "✓" : done === false ? "·" : ""}
                      </i>
                    ))}
                  </div>
                  <span>{habit.streak == null ? "Sin datos" : <><b>{habit.streak}</b> días</>}</span>
                  <div className="rate-cell">
                    {habit.rate == null ? <span>Aún no calculado</span> : <><ProgressBar value={habit.rate} accent={habit.rate < 60 ? "#b98275" : "#8fa9d7"} small /><b>{habit.rate}%</b></>}
                  </div>
                </article>
              ))}
            </section>

            <section className="habit-insight panel">
              <span>✦</span>
              <div>
                <p className="eyebrow">Lectura de la semana</p>
                <h3>{weeklyPossible ? "Tu patrón se construirá con evidencia." : "Todavía no hay una semana que analizar."}</h3>
                <p>
                  Registra sueño, pantallas y hábitos durante varios días. Entonces el sistema
                  podrá comparar patrones sin confundirte con conclusiones de demostración.
                </p>
              </div>
            </section>
          </div>
        )}

        {view === "nutrition" && (
          <div className="content-view nutrition-view">
            <section className="nutrition-hero panel">
              <div>
                <p className="eyebrow">Nutrición</p>
                <h2>Alimenta el progreso.</h2>
                <p>Planifica, registra y descubre qué puedes sostener. Sin dietas inventadas ni días “perfectos”.</p>
                <div className="nutrition-actions"><button className="primary-action" onClick={() => setModal("meal")}>Registrar comida</button><button className="secondary-action" onClick={() => prepareNutritionHabit()}>+ Hábito</button><button className="secondary-action" onClick={() => { setPlanForm((current) => ({ ...current, area: "nutrition" })); setModal("plan"); }}>Plan de observación</button></div>
              </div>
              <div className="nutrition-hero__mark" aria-hidden="true">
                <span><Utensils size={32} strokeWidth={1.5} /></span>
                <strong>{nutritionConsistency == null ? "—" : `${nutritionConsistency}%`}</strong>
                <small>constancia</small>
              </div>
            </section>

            {trackingPlans.filter((plan) => plan.area === "nutrition").map((plan) => <section className="meal-log panel" key={plan.id}><div className="section-heading"><div><p className="eyebrow">{plan.status === "active" ? "En observación" : "Planificado"}</p><h3>{plan.title}</h3></div><span>{plan.startDate ?? "Sin fecha"}{plan.endDate ? ` → ${plan.endDate}` : ""}</span></div><p>{plan.notes}</p>{plan.instructions.length > 0 && <ul>{plan.instructions.map((item) => <li key={item}>{item}</li>)}</ul>}</section>)}

            <section className="nutrition-kpis">
              <article className="nutrition-kpi panel"><small>Hábitos activos</small><strong>{nutritionHabits.length}</strong><span>solo registros de nutrición</span></article>
              <article className="nutrition-kpi panel"><small>Mejor racha</small><strong>{strongestNutritionHabit?.streak == null ? "Sin datos" : `${strongestNutritionHabit.streak} días`}</strong><span>{strongestNutritionHabit?.title ?? "Sin registros"}</span></article>
              <article className="nutrition-kpi panel"><small>Energía</small><strong>{bodyMeasurement?.energyLevel == null ? "—" : `${bodyMeasurement.energyLevel}/5`}</strong><span>{bodyMeasurement?.recordedOn ?? "Sin medición"}</span></article>
              <article className="nutrition-kpi panel"><small>Metas activas</small><strong>{nutritionGoals.length}</strong><span>resultados relacionados</span></article>
            </section>

            <section className="nutrition-main-grid">
              <article className="nutrition-tracker panel">
                <div className="section-heading">
                  <div><p className="eyebrow">Hoy</p><h3>Hábitos de alimentación</h3></div>
                  <button className="secondary-action" onClick={() => prepareNutritionHabit()}>Añadir</button>
                </div>
                <div className="nutrition-habit-list">
                  {nutritionHabits.map((habit) => {
                    const completedToday = habit.week.at(-1) ?? false;
                    return (
                      <button className={completedToday ? "nutrition-habit nutrition-habit--done" : "nutrition-habit"} key={habit.id} onClick={() => toggleTrackedHabit(habit)}>
                        <span>{completedToday ? "✓" : ""}</span>
                        <div><strong>{habit.title}</strong><small>{habit.goal} · {habit.streak == null ? "sin racha registrada" : `racha ${habit.streak} días`}</small></div>
                        <b>{habit.rate == null ? "—" : `${habit.rate}%`}</b>
                      </button>
                    );
                  })}
                  {nutritionHabits.length === 0 && (
                    <div className="nutrition-empty">
                      <strong>Sin hábitos todavía</strong>
                      <p>Elige una base simple y ajústala a tu vida.</p>
                    </div>
                  )}
                </div>
              </article>

              <article className="nutrition-measurements panel">
                <div className="section-heading"><div><p className="eyebrow">Evidencia</p><h3>Mediciones</h3></div></div>
                <div className="nutrition-measurement-list">
                  {realBodyMetrics.map((metric) => <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}
                </div>
                <button className="ghost-action" onClick={() => { setEntryType("Medición"); setModal("quick"); }}>Registrar medición</button>
              </article>
            </section>

            <section className="meal-log panel">
              <div className="section-heading"><div><p className="eyebrow">Reporte natural</p><h3>Comidas recientes</h3></div><button className="secondary-action" onClick={() => setModal("meal")}>+ Registrar</button></div>
              {mealData.length ? <div className="meal-log__list">{mealData.slice(0, 5).map((meal) => <article key={meal.id}><span>{meal.mealType === "breakfast" ? "Desayuno" : meal.mealType === "lunch" ? "Almuerzo" : meal.mealType === "dinner" ? "Cena" : meal.mealType === "snack" ? "Snack" : "Otra comida"}</span><strong>{meal.description}</strong>{meal.observation && <small>{meal.observation}</small>}<time>{meal.mealDate}</time></article>)}</div> : <div className="nutrition-empty nutrition-empty--compact"><strong>Sin comidas registradas</strong><p>Escribe lo que comiste en lenguaje normal. No necesitas calorías ni pesos.</p></div>}
            </section>

            <section className="nutrition-suggestions panel">
              <div className="section-heading">
                <div><p className="eyebrow">Punto de partida</p><h3>Hábitos que puedes adaptar</h3></div>
              </div>
              <div className="nutrition-suggestion-grid">
                {nutritionHabitSuggestions.map((suggestion) => {
                  const exists = nutritionHabits.some((habit) => habit.title === suggestion.title);
                  return (
                    <article key={suggestion.title}>
                      <span><Utensils size={17} strokeWidth={1.6} /></span>
                      <div><strong>{suggestion.title}</strong><small>{suggestion.detail}</small></div>
                      <button disabled={exists} onClick={() => prepareNutritionHabit(suggestion.title, suggestion.unit)}>{exists ? "Añadido" : "Añadir"}</button>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="nutrition-goals panel">
              <div className="section-heading">
                <div><p className="eyebrow">Dirección</p><h3>Metas relacionadas</h3></div>
                <button className="secondary-action" onClick={() => { setEntryType("Meta"); setModal("quick"); }}>+ Meta</button>
              </div>
              {nutritionGoals.length > 0 ? (
                <div className="nutrition-goal-list">
                  {nutritionGoals.map((goal) => <article key={goal.id}><strong>{goal.title}</strong><span>{goal.currentValue ?? "—"} → {goal.targetValue ?? "—"} {goal.unit}</span><small>{goal.targetDate ?? "Sin fecha"}</small></article>)}
                </div>
              ) : <div className="nutrition-empty nutrition-empty--compact"><strong>Sin metas nutricionales</strong><p>Crea una solo si el resultado realmente necesita seguimiento.</p></div>}
            </section>
          </div>
        )}

        {view === "dopamine" && (
          <div className="content-view dopamine-view">
            <section className="dopamine-hero panel">
              <div className="dopamine-hero__copy">
                <p className="eyebrow">Atención</p>
                <h2>Entrena tu atención.</h2>
                <p>Mide celular, estímulos rápidos, ocio elegido y bloques sin pantallas.</p>
                <div className="nutrition-actions"><button className="primary-action" onClick={() => { setEntryType("Pantallas"); setModal("quick"); }}>Registrar el día</button><button className="secondary-action" onClick={() => { setPlanForm((current) => ({ ...current, area: "attention" })); setModal("plan"); }}>Planificar línea base</button></div>
              </div>
              <div className="attention-orbit" aria-hidden="true">
                <span className="attention-orbit__ring" />
                <span className="attention-orbit__ring attention-orbit__ring--two" />
                <strong>{attentionControlToday ?? "—"}</strong>
                <small>{attentionControlToday == null ? "Sin datos" : "% de uso fuera de estímulos rápidos"}</small>
              </div>
            </section>

            {trackingPlans.filter((plan) => plan.area === "attention").map((plan) => <section className="attention-protocol panel" key={plan.id}><div><p className="eyebrow">{plan.status === "planned" ? "Por registrar" : plan.status}</p><h3>{plan.title}</h3><p>{plan.notes}</p><small>{plan.startDate ?? "Sin fecha"}{plan.endDate ? ` → ${plan.endDate}` : ""}</small></div></section>)}

            <div className="progress-tabs" role="tablist" aria-label="Secciones de atención">
              <button className={attentionTab === "overview" ? "is-active" : ""} onClick={() => setAttentionTab("overview")}>Seguimiento</button>
              <button className={attentionTab === "resources" ? "is-active" : ""} onClick={() => setAttentionTab("resources")}>Recursos</button>
            </div>

            {attentionTab === "overview" && <>
            <section className="dopamine-metric-grid">
              {digitalMetricCards.map(({ key, label, detail, icon: Icon }) => (
                <article className="dopamine-metric panel" key={key}>
                  <span><Icon aria-hidden="true" size={18} strokeWidth={1.7} /></span>
                  <div><small>{label}</small><strong>{digitalWellbeing[key] == null ? "Sin datos" : `${digitalWellbeing[key]} min`}</strong><p>{detail}</p></div>
                </article>
              ))}
            </section>

            <section className="attention-grid">
              <article className="attention-chart panel">
                <div className="section-heading">
                  <div><p className="eyebrow">Últimos 7 días</p><h3>Mapa de consumo digital</h3></div>
                  <span>{recordedDigitalDays.length}/7 registrados</span>
                </div>
                {recordedDigitalDays.length ? <div className="digital-chart" role="img" aria-label="Comparación de tiempo de celular y estímulos rápidos en los últimos siete días">
                  {recentDigitalDays.map((day) => {
                    const total = day.screenTimeMinutes ?? 0;
                    const rapid = (day.socialMediaMinutes ?? 0) + (day.shortVideoMinutes ?? 0);
                    const maxMinutes = Math.max(360, ...recentDigitalDays.map((item) => item.screenTimeMinutes ?? 0));
                    return (
                      <div className="digital-chart__day" key={day.date}>
                        <div className="digital-chart__bars">
                          <i style={{ height: `${Math.max(total ? 4 : 0, (total / maxMinutes) * 100)}%` }} />
                          <b style={{ height: `${Math.max(rapid ? 4 : 0, (rapid / maxMinutes) * 100)}%` }} />
                        </div>
                        <small>{new Intl.DateTimeFormat("es-EC", { weekday: "short" }).format(new Date(`${day.date}T12:00:00`)).replace(".", "")}</small>
                      </div>
                    );
                  })}
                </div> : <div className="chart-empty"><strong>Sin datos</strong><small>Registra un día de pantalla para iniciar el mapa.</small></div>}
                {recordedDigitalDays.length > 0 && <div className="digital-chart__legend"><span><i /> Celular total</span><span><b /> Redes + videos cortos</span></div>}
              </article>

              <article className="attention-balance panel">
                <p className="eyebrow">Lectura de hoy</p>
                <h3>Balance de atención</h3>
                <div className="attention-balance__rows">
                  <div className="attention-balance__positive"><span>Control de atención</span><strong>{attentionControlToday == null ? "—" : `${attentionControlToday}%`}</strong><small>Porción del celular fuera de redes y videos cortos</small></div>
                  <div><span>Estímulos rápidos</span><strong>{rapidStimuliToday == null ? "Sin datos" : `${rapidStimuliToday} min`}</strong><small>Redes + videos cortos</small></div>
                  <div><span>Videojuegos</span><strong>{digitalWellbeing.gamingMinutes == null ? "Sin datos" : `${digitalWellbeing.gamingMinutes} min`}</strong><small>Entretenimiento interactivo</small></div>
                  <div><span>Uso sin clasificar</span><strong>{unclassifiedScreenToday == null ? "Sin datos" : `${unclassifiedScreenToday} min`}</strong><small>Estudio, mensajes, utilidades u otros</small></div>
                  <div><span>Ocio intencional</span><strong>{digitalWellbeing.intentionalLeisureMinutes == null ? "Sin datos" : `${digitalWellbeing.intentionalLeisureMinutes} min`}</strong><small>Descanso elegido conscientemente</small></div>
                </div>
              </article>
            </section>

            <section className="dopamine-lower-grid">
              <article className="attention-insight panel">
                <span><Sparkles aria-hidden="true" size={21} /></span>
                <div><p className="eyebrow">Lectura estratégica</p><h3>{digitalInsight}</h3></div>
              </article>
              <article className="digital-averages panel">
                <div><p className="eyebrow">Promedio registrado</p><h3>Tu semana, sin juicio</h3></div>
                <dl>
                  <div><dt>Celular</dt><dd>{averageDigital("screenTimeMinutes") == null ? "Sin datos" : `${averageDigital("screenTimeMinutes")} min/día`}</dd></div>
                  <div><dt>Estímulos rápidos</dt><dd>{averageRapid == null ? "Sin datos" : `${averageRapid} min/día`}</dd></div>
                  <div><dt>Ocio elegido</dt><dd>{averageDigital("intentionalLeisureMinutes") == null ? "Sin datos" : `${averageDigital("intentionalLeisureMinutes")} min/día`}</dd></div>
                  <div><dt>Ayuno de estímulos</dt><dd>{averageDigital("stimulationFastMinutes") == null ? "Sin datos" : `${averageDigital("stimulationFastMinutes")} min/día`}</dd></div>
                </dl>
              </article>
              <article className="attention-protocol panel">
                <p className="eyebrow">Protocolo de control</p>
                <h3>Antes de abrir por impulso</h3>
                <ol>
                  <li><span>1</span><div><strong>Nombra la intención</strong><small>¿Qué vas a hacer exactamente?</small></div></li>
                  <li><span>2</span><div><strong>Elige un límite</strong><small>Tiempo o resultado de salida.</small></div></li>
                  <li><span>3</span><div><strong>Cierra conscientemente</strong><small>No esperes a que el feed decida.</small></div></li>
                </ol>
              </article>
            </section>

            <section className="stimulation-fast panel">
              <div className="stimulation-fast__copy">
                <p className="eyebrow">Ayuno de estímulos</p>
                <h3>Recupera el mando.</h3>
                <p>Un bloque sin feeds, videos cortos ni videojuegos. Puedes caminar, orar, leer o estudiar sin multitarea.</p>
                <button className="secondary-action" onClick={() => { setEntryType("Pantallas"); setModal("quick"); }}>Registrar bloque</button>
              </div>
              <div className="stimulation-fast__score">
                <span>Hoy</span>
                <strong>{digitalWellbeing.stimulationFastMinutes == null ? "Sin datos" : <>{digitalWellbeing.stimulationFastMinutes}<small> min</small></>}</strong>
                {digitalWellbeing.stimulationFastMinutes != null && <ProgressBar value={Math.min(100, (digitalWellbeing.stimulationFastMinutes / 120) * 100)} accent="var(--emerald)" />}
              </div>
            </section>
            </>}

            {attentionTab === "resources" && <section className="campaign-library">
              <div className="section-heading">
                <div><p className="eyebrow">Biblioteca</p><h3>Lecturas para entrenar el criterio</h3></div>
              </div>
              <div className="campaign-library__grid">
                {attentionBooks.map((book) => (
                  <article className="book-card panel" key={book.title}>
                    <span><BookOpenText aria-hidden="true" size={20} strokeWidth={1.7} /></span>
                    <div><small>{book.theme}</small><h4>{book.title}</h4><p>{book.author}</p></div>
                    <button onClick={() => { setEntryType("Tarea"); setTaskSubject("Lectura"); setNote(`Leer: ${book.title}`); setModal("quick"); }}>Planear lectura</button>
                  </article>
                ))}
              </div>
            </section>}
          </div>
        )}

        {view === "journal" && (
          <div className="content-view journal-view">
            <section className="journal-prompt panel">
              <p className="eyebrow">Pregunta de esta noche</p>
              <h2>¿Qué hiciste hoy que tu yo de hace un mes habría evitado?</h2>
              <textarea
                placeholder="Escribe sin preocuparte por hacerlo perfecto…"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <div>
                <small>Solo tú puedes ver estas notas.</small>
                <button
                  className="secondary-action"
                  disabled={saving}
                  onClick={saveJournal}
                >
                  {saving ? "Guardando…" : "Guardar reflexión"}
                </button>
              </div>
            </section>
            <section className="reflection-cycles panel">
              <p className="eyebrow">Ciclos de revisión</p>
              <h3>No solo registrar: interpretar y corregir.</h3>
              <div>
                <button onClick={() => setNote("Victorias:\n\nDificultades:\n\nLo que aprendí:\n\nUn ajuste para la próxima semana:")}>
                  <span>7 días</span><strong>Revisión semanal</strong><small>Hábitos, metas, energía y una decisión</small>
                </button>
                <button onClick={() => setNote("Resultado principal del mes:\n\nPatrón que quiero conservar:\n\nPatrón que debo corregir:\n\nEnfoque del siguiente mes:")}>
                  <span>30 días</span><strong>Revisión mensual</strong><small>Tendencias, resultados y nuevo enfoque</small>
                </button>
              </div>
            </section>
            <section className="journal-list">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Bitácora</p>
                </div>
              </div>
              {journalData.map((entry) => (
                <article className="journal-entry panel" key={entry.id}>
                  <div>
                    <span className="tag">Diario</span>
                    <small>{entry.date}</small>
                  </div>
                  <h3>{entry.mood ? `Estado ${entry.mood}/5` : "Reflexión del día"}</h3>
                  <p>{entry.body}</p>
                </article>
              ))}
              {journalData.length === 0 && (
                <article className="empty-state panel">
                  <strong>Sin entradas</strong>
                  <p>Escribe tu primera reflexión.</p>
                </article>
              )}
            </section>
          </div>
        )}

        {view === "system" && (
          <div className="content-view system-view">
            <section className="system-hero panel">
              <span><Settings2 aria-hidden="true" size={28} /></span>
              <div><p className="eyebrow">Reglas transparentes</p><h2>El sistema está para acompañarte, no para vigilarte.</h2><p>Tu reporte honesto es válido. Las evidencias externas son opcionales y nunca sustituyen tu criterio.</p></div>
            </section>

            <section className="system-grid">
              {season.status === "planned" && (
                <article className="panel system-card system-card--wide system-card--setup">
                  <p className="eyebrow">Temporada 1</p>
                  <h3>La temporada todavía no ha comenzado.</h3>
                  <p>Confirma tu propósito opcional, tus mínimos y la fecha desde la que se calculará la Semana 1.</p>
                  <button className="primary-action" type="button" onClick={() => setShowOnboarding(true)}>
                    Configurar y comenzar <ArrowRight size={16} />
                  </button>
                </article>
              )}
              <article className="panel system-card system-card--account">
                <p className="eyebrow">Cuenta</p>
                <h3>{reviewMode ? "Vista pública segura" : "Sesión de Andre"}</h3>
                <p>{reviewMode ? "Salir de esta representación no modifica datos." : "Cierra la sesión únicamente en este dispositivo."}</p>
                <button className="ghost-action" type="button" onClick={signOut}>{reviewMode ? "Cerrar revisión" : "Cerrar sesión"}</button>
              </article>
              <article className="panel system-card system-card--wide"><p className="eyebrow">Brújula y propósito</p><h3>{profileSettings.purpose || "Por definir"}</h3><p>El propósito orienta decisiones; no se convierte en porcentaje ni afecta tu valor personal.</p></article>
              <article className="panel system-card">
                <p className="eyebrow">Estado</p>
                <h3>{season.status === "active" ? "Temporada activa" : season.status === "completed" ? "Temporada completada" : "En preparación"}</h3>
                <dl><div><dt>Inicio</dt><dd>{season.status === "active" ? season.startDate : season.startDate ? `${season.startDate} · propuesta` : "Por confirmar"}</dd></div><div><dt>Final</dt><dd>{season.status === "active" ? season.endDate : "Por calcular"}</dd></div><div><dt>Semana</dt><dd>{season.week ?? "—"}</dd></div></dl>
                <button className="ghost-action" type="button" onClick={() => setShowOnboarding(true)}>{season.status === "planned" ? "Editar preparación" : "Reconfigurar temporada"}</button>
              </article>
              <article className="panel system-card"><p className="eyebrow">No negociables</p><h3>{activeMinimumItems.length} de 3 activos</h3><p>{activeMinimumItems.length ? activeMinimumItems.map((item) => item.title).join(" · ") : "Todavía no has elegido tus mínimos."}</p></article>
              <article className="panel system-card"><p className="eyebrow">XP y dominio</p><h3>Dos medidas separadas</h3><p>El XP reconoce acciones, esfuerzo y constancia reportados. El dominio se construye gradualmente con prácticas y resultados. La tabla numérica definitiva aún está pendiente de tu aprobación.</p></article>
              <article className="panel system-card"><p className="eyebrow">Rachas</p><h3>Constancia, no castigo</h3><p>Un incumplimiento puede afectar una racha, pero nunca resta XP ni borra lo que ya construiste.</p></article>
              <article className="panel system-card"><p className="eyebrow">Día difícil</p><h3>Reduce la carga</h3><p>Protege necesidades básicas y elige una acción pequeña. Dormir, comer y recuperarte nunca son recompensas bloqueadas.</p><button className="ghost-action" onClick={() => setModal("recovery")}>Crear misión de recuperación</button></article>
              <article className="panel system-card"><p className="eyebrow">Monedas y recompensas</p><h3>Reglas pendientes</h3><p>No hay precios ni recompensas automáticas. Se configurarán contigo antes de activarlas.</p></article>
              <article className="panel system-card"><p className="eyebrow">Progreso general</p><h3>Ventana de 28 días</h3><p>Las barras solo aparecen cuando existen registros suficientes. Antes muestran “Aún no calculado”.</p></article>
              <article className="panel system-card system-card--wide"><p className="eyebrow">Privacidad e IA futura</p><h3>Las decisiones importantes siempre requieren confirmación.</h3><p>La IA podrá registrar acciones pequeñas que le pidas directamente. No podrá inventar actividades ni consultar tu diario sin autorización. Acceso al diario: <strong>{profileSettings.journalAiAllowed ? "autorizado" : "no autorizado"}</strong>.</p></article>
            </section>
          </div>
        )}
      </section>

      {mobileMoreOpen && (
        <div className="mobile-more-layer">
          <button className="mobile-more-backdrop" type="button" onClick={() => setMobileMoreOpen(false)} aria-label="Cerrar menú" />
          <section className="mobile-more-panel" id="mobile-more-menu" aria-label="Más módulos">
            <header><strong>Más</strong><button type="button" onClick={() => setMobileMoreOpen(false)} aria-label="Cerrar menú"><X size={19} /></button></header>
            <div>
              {mobileMoreNavItems.map((item) => {
                const Icon = item.icon;
                return <button key={item.id} className={view === item.id ? "is-active" : ""} type="button" onClick={() => { setView(item.id); setMobileMoreOpen(false); }}><Icon aria-hidden="true" size={19} /><span>{item.label}</span></button>;
              })}
            </div>
          </section>
        </div>
      )}

      <nav className="mobile-nav" aria-label="Navegación móvil">
        {mobilePrimaryNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={view === item.id ? "mobile-nav__active" : ""}
              type="button"
              onClick={() => { setView(item.id); setMobileMoreOpen(false); }}
            >
              <span><Icon aria-hidden="true" size={18} strokeWidth={1.8} /></span>
              {item.label}
            </button>
          );
        })}
        <button
          className={mobileMoreNavItems.some((item) => item.id === view) || mobileMoreOpen ? "mobile-nav__active" : ""}
          type="button"
          aria-expanded={mobileMoreOpen}
          aria-controls="mobile-more-menu"
          onClick={() => setMobileMoreOpen((current) => !current)}
        >
          <span><Menu aria-hidden="true" size={18} strokeWidth={1.8} /></span>
          Más
        </button>
      </nav>

      {(reviewMode || dataStatus === "ready") && (
        <SeasonOnboarding
          open={showOnboarding}
          displayName={reviewMode ? "Andre" : userLabel}
          initialPurpose={profileSettings.purpose}
          initialSeasonName={season.name}
          initialSeasonObjective={season.objective}
          initialStartDate={season.startDate ?? ""}
          initialCurrentSubjects={subjectData.filter((subject) => subject.status === "studying").map((subject) => subject.name)}
          initialPlannedSubjects={subjectData.filter((subject) => subject.status === "pending").map((subject) => subject.name)}
          initialNonNegotiables={(Object.keys(habitIds) as HabitKey[]).filter((key) => Boolean(habitIds[key])).slice(0, 3)}
          suggestedStartDate={clientClock?.today ?? ""}
          reviewMode={reviewMode}
          saving={saving}
          onSaveDraft={saveSeasonDraft}
          onStart={startSeason}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {modal === "quick" && (
        <Modal
          title="Registrar algo"
          eyebrow="Captura rápida"
          onClose={() => setModal(null)}
        >
          <div className="segmented segmented--five">
            {["Actividad", "Sesión de estudio", "Tarea", "Examen", "Hábito", "Meta", "Medición", "Pantallas", "Diario"].map((type) => (
              <button
                key={type}
                className={entryType === type ? "segmented__active" : ""}
                onClick={() => setEntryType(type)}
              >
                {type}
              </button>
            ))}
          </div>
          {entryType !== "Medición" && entryType !== "Pantallas" && (
            <label className="field">
              <span>{entryType === "Diario" ? "Tu reflexión" : "¿Qué quieres registrar?"}</span>
              <textarea
                autoFocus
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={
                  entryType === "Tarea" || entryType === "Examen"
                    ? "Ej.: Resolver taller de normalización"
                    : entryType === "Meta"
                      ? "Ej.: Llegar al 12% de grasa corporal"
                      : "Cuéntalo como ocurrió. Tu reporte honesto es suficiente."
                }
              />
            </label>
          )}
          {(entryType === "Tarea" || entryType === "Examen" || entryType === "Sesión de estudio") && (
            <div className="field-row">
              <label className="field">
                <span>Materia o área</span>
                <input
                  type="text"
                  value={taskSubject}
                  onChange={(event) => setTaskSubject(event.target.value)}
                  placeholder="Ej.: Estadística"
                />
              </label>
              {entryType === "Sesión de estudio" ? (
                <label className="field">
                  <span>Duración (min)</span>
                  <input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="Sin duración automática" />
                </label>
              ) : (
                <label className="field field--date">
                  <span>Fecha</span>
                  <input type="date" value={taskDate} onChange={(event) => setTaskDate(event.target.value)} />
                </label>
              )}
            </div>
          )}
          {entryType === "Sesión de estudio" && (
            <div className="field-row">
              <label className="field">
                <span>Habilidad</span>
                <select value={selectedSkill.name} onChange={(event) => {
                  const skill = realAttributeGroups.flatMap((group) => group.skills).find((candidate) => candidate.name === event.target.value);
                  if (skill) setSelectedSkillName(skill.name);
                }}>
                  {realAttributeGroups.flatMap((group) => group.skills).map((skill) => <option key={skill.name}>{skill.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Tipo de práctica</span>
                <select value={studyMode} onChange={(event) => setStudyMode(event.target.value as typeof studyMode)}>
                  <option value="reading">Lectura</option><option value="guided">Con ayuda</option><option value="practice">Práctica</option><option value="independent">Independiente</option><option value="simulation">Simulacro</option>
                </select>
              </label>
            </div>
          )}
          {entryType === "Actividad" && (
            <div className="field-row">
              <label className="field"><span>Área</span><select value={activityCategory} onChange={(event) => setActivityCategory(event.target.value)}><option value="general">General</option><option value="study">Estudio</option><option value="training">Entrenamiento</option><option value="work">Trabajo</option><option value="creative">Creatividad</option><option value="faith">Fe</option><option value="relationship">Relaciones</option></select></label>
              <label className="field"><span>Duración opcional (min)</span><input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="Por registrar" /></label>
            </div>
          )}
          {entryType === "Hábito" && (
            <div className="onboarding-form-grid">
              <label className="field"><span>Tipo</span><select value={habitForm.kind} onChange={(event) => setHabitForm((current) => ({ ...current, kind: event.target.value }))}><option value="habit">Hábito</option><option value="non_negotiable">No negociable</option></select></label>
              <label className="field"><span>Frecuencia</span><select value={habitForm.frequency} onChange={(event) => setHabitForm((current) => ({ ...current, frequency: event.target.value }))}><option value="daily">Diario</option><option value="weekdays">Lunes a viernes</option><option value="weekly">Objetivo semanal</option><option value="continuous_cycle">Ciclo continuo</option></select></label>
              {(habitForm.frequency === "daily" || habitForm.frequency === "weekdays") && <label className="field"><span>Objetivo por día</span><input type="number" min="1" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} placeholder="1" /></label>}
              {(habitForm.frequency === "weekly" || habitForm.frequency === "continuous_cycle") && <label className="field"><span>Sesiones por semana</span><input type="number" min="1" value={habitForm.weeklyTarget} onChange={(event) => setHabitForm((current) => ({ ...current, weeklyTarget: event.target.value }))} placeholder="Por definir" /></label>}
              <label className="field"><span>Unidad</span><input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="sesión, rutina, registro…" /></label>
              <label className="field"><span>Duración mínima (min)</span><input type="number" min="1" value={habitForm.durationMin} onChange={(event) => setHabitForm((current) => ({ ...current, durationMin: event.target.value }))} placeholder="Opcional" /></label>
              <label className="field"><span>Duración máxima (min)</span><input type="number" min="1" value={habitForm.durationMax} onChange={(event) => setHabitForm((current) => ({ ...current, durationMax: event.target.value }))} placeholder="Opcional" /></label>
              <label className="field"><span>Fecha de inicio</span><input inputMode="numeric" value={habitForm.startDate} onChange={(event) => setHabitForm((current) => ({ ...current, startDate: event.target.value }))} placeholder="AAAA-MM-DD" /></label>
              <label className="field"><span>Horario o regla</span><input value={habitForm.schedule} onChange={(event) => setHabitForm((current) => ({ ...current, schedule: event.target.value }))} placeholder="Opcional" /></label>
              {habitForm.frequency === "continuous_cycle" && <label className="field field--wide"><span>Secuencia del ciclo</span><input value={habitForm.cycle} onChange={(event) => setHabitForm((current) => ({ ...current, cycle: event.target.value }))} placeholder="Paso 1, Paso 2, Paso 3…" /></label>}
              <label className="field field--wide"><span>Qué cuenta</span><textarea value={habitForm.details} onChange={(event) => setHabitForm((current) => ({ ...current, details: event.target.value }))} placeholder="Criterios observables, sin castigos ni suposiciones" /></label>
              {habitForm.kind === "non_negotiable" && <label className="field field--wide"><span>Versión de día difícil</span><input value={habitForm.difficultDay} onChange={(event) => setHabitForm((current) => ({ ...current, difficultDay: event.target.value }))} placeholder="Mínimo realista" /></label>}
              <label className="field field--wide"><span><input type="checkbox" checked={habitForm.optional} onChange={(event) => setHabitForm((current) => ({ ...current, optional: event.target.checked }))} /> Oportunidad adicional opcional; no cuenta como incumplimiento</span></label>
            </div>
          )}
          {entryType === "Meta" && (
            <>
              <div className="field-row">
                <label className="field"><span>Valor actual</span><input type="number" step="any" value={numberValue} onChange={(event) => setNumberValue(event.target.value)} /></label>
                <label className="field"><span>Resultado objetivo</span><input type="number" step="any" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} /></label>
              </div>
              <div className="field-row">
                <label className="field"><span>Unidad</span><input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="%, kg, USD, materias…" /></label>
                <label className="field"><span>Fecha objetivo</span><input type="date" value={taskDate} onChange={(event) => setTaskDate(event.target.value)} /></label>
              </div>
            </>
          )}
          {entryType === "Medición" && (
            <div className="metric-form-grid">
              <label className="field"><span>Fecha de medición</span><input inputMode="numeric" value={bodyForm.recordedOn} onChange={(event) => setBodyForm((current) => ({ ...current, recordedOn: event.target.value }))} placeholder="AAAA-MM-DD" /></label>
              <label className="field"><span>Estatura (cm)</span><input type="number" step=".1" value={bodyForm.height} onChange={(event) => setBodyForm((current) => ({ ...current, height: event.target.value }))} placeholder="Por registrar" /></label>
              <label className="field"><span>Peso (kg)</span><input type="number" step=".1" value={bodyForm.weight} onChange={(event) => setBodyForm((current) => ({ ...current, weight: event.target.value }))} placeholder="Por registrar" /></label>
              <label className="field"><span>Cintura (cm)</span><input type="number" step=".1" value={bodyForm.waist} onChange={(event) => setBodyForm((current) => ({ ...current, waist: event.target.value }))} placeholder="Por registrar" /></label>
              <label className="field"><span>Grasa estimada (%)</span><input type="number" step=".1" value={bodyForm.fat} onChange={(event) => setBodyForm((current) => ({ ...current, fat: event.target.value }))} placeholder="Por registrar" /></label>
              <label className="field"><span>Energía (1–5)</span><input type="number" min="1" max="5" value={bodyForm.energy} onChange={(event) => setBodyForm((current) => ({ ...current, energy: event.target.value }))} placeholder="Por registrar" /></label>
              <label className="field"><span>Sueño (horas)</span><input type="number" step=".1" min="0" value={bodyForm.sleep} onChange={(event) => setBodyForm((current) => ({ ...current, sleep: event.target.value }))} placeholder="Por registrar" /></label>
              <label className="field field--wide"><span>Contexto</span><textarea value={bodyForm.context} onChange={(event) => setBodyForm((current) => ({ ...current, context: event.target.value }))} placeholder="Ej. fecha aproximada o condiciones de la medición" /></label>
            </div>
          )}
          {entryType === "Pantallas" && (
            <>
              <p className="form-help">Copia los minutos desde Bienestar digital. Medimos conducta, no dopamina biológica.</p>
              <div className="metric-form-grid">
                <label className="field"><span>Celular total</span><input type="number" min="0" value={digitalForm.screen} onChange={(event) => setDigitalForm((current) => ({ ...current, screen: event.target.value }))} /></label>
                <label className="field"><span>Redes sociales</span><input type="number" min="0" value={digitalForm.social} onChange={(event) => setDigitalForm((current) => ({ ...current, social: event.target.value }))} /></label>
                <label className="field"><span>Videos cortos</span><input type="number" min="0" value={digitalForm.shortVideo} onChange={(event) => setDigitalForm((current) => ({ ...current, shortVideo: event.target.value }))} /></label>
                <label className="field"><span>Videojuegos</span><input type="number" min="0" value={digitalForm.gaming} onChange={(event) => setDigitalForm((current) => ({ ...current, gaming: event.target.value }))} /></label>
                <label className="field"><span>Ocio intencional</span><input type="number" min="0" value={digitalForm.leisure} onChange={(event) => setDigitalForm((current) => ({ ...current, leisure: event.target.value }))} /></label>
                <label className="field"><span>Ayuno de estímulos</span><input type="number" min="0" value={digitalForm.fast} onChange={(event) => setDigitalForm((current) => ({ ...current, fast: event.target.value }))} /></label>
              </div>
            </>
          )}
          {entryType === "Diario" && (
            <label className="field"><span>Estado (1–5)</span><input type="number" min="1" max="5" value={mood} onChange={(event) => setMood(event.target.value)} /></label>
          )}
          <div className="modal__actions">
            <button className="ghost-action" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button className="primary-action modal-primary" disabled={saving} onClick={saveQuickEntry}>
              {saving ? "Guardando…" : "Guardar registro"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "plan" && (
        <Modal title="Plan de observación" eyebrow="Medir antes de concluir" onClose={() => setModal(null)}>
          <div className="onboarding-form-grid">
            <label className="field"><span>Área</span><select value={planForm.area} onChange={(event) => setPlanForm((current) => ({ ...current, area: event.target.value }))}><option value="nutrition">Nutrición</option><option value="attention">Atención</option><option value="physical">Físico</option><option value="study">Estudio</option><option value="general">General</option></select></label>
            <label className="field"><span>Estado</span><select value={planForm.status} onChange={(event) => setPlanForm((current) => ({ ...current, status: event.target.value }))}><option value="planned">Planificado</option><option value="active">Activo</option><option value="paused">Pausado</option><option value="completed">Completado</option></select></label>
            <label className="field field--wide"><span>Nombre</span><input value={planForm.title} onChange={(event) => setPlanForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ej. Línea base de siete días" /></label>
            <label className="field"><span>Inicio</span><input inputMode="numeric" value={planForm.startDate} onChange={(event) => setPlanForm((current) => ({ ...current, startDate: event.target.value }))} placeholder="AAAA-MM-DD" /></label>
            <label className="field"><span>Final</span><input inputMode="numeric" value={planForm.endDate} onChange={(event) => setPlanForm((current) => ({ ...current, endDate: event.target.value }))} placeholder="AAAA-MM-DD" /></label>
            <label className="field field--wide"><span>Qué observar</span><textarea value={planForm.instructions} onChange={(event) => setPlanForm((current) => ({ ...current, instructions: event.target.value }))} placeholder="Una indicación por línea" /></label>
            <label className="field field--wide"><span>Notas y límites</span><textarea value={planForm.notes} onChange={(event) => setPlanForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Qué no se concluirá ni exigirá durante esta fase" /></label>
          </div>
          <div className="modal__actions"><button className="ghost-action" onClick={() => setModal(null)}>Cancelar</button><button className="primary-action modal-primary" disabled={saving} onClick={savePlan}>{saving ? "Guardando…" : "Guardar plan"}</button></div>
        </Modal>
      )}

      {modal === "meal" && (
        <Modal title="Registrar alimentación" eyebrow="Sin calorías obligatorias" onClose={() => setModal(null)}>
          <div className="field-row">
            <label className="field"><span>Tipo de comida</span><select value={mealType} onChange={(event) => setMealType(event.target.value)}><option value="breakfast">Desayuno</option><option value="lunch">Almuerzo</option><option value="dinner">Cena</option><option value="snack">Snack</option><option value="other">Otra</option></select></label>
          </div>
          <label className="field"><span>¿Qué comiste?</span><textarea autoFocus value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ej.: Almorcé pollo con arroz, ensalada y agua" /></label>
          <label className="field"><span>Observación opcional</span><textarea value={mealObservation} onChange={(event) => setMealObservation(event.target.value)} placeholder="Hambre, contexto o algo que quieras recordar" /></label>
          <p className="form-help">Este registro sirve para observar patrones sin juzgarte. No calcula calorías ni castiga alimentos.</p>
          <div className="modal__actions"><button className="ghost-action" onClick={() => setModal(null)}>Cancelar</button><button className="primary-action modal-primary" disabled={saving} onClick={saveMeal}>{saving ? "Guardando…" : "Guardar comida"}</button></div>
        </Modal>
      )}

      {modal === "study" && (
        <Modal
          title="¿Cómo estudiaste realmente?"
          eyebrow="Cierre de misión"
          onClose={() => setModal(null)}
        >
          <label className="field"><span>Duración real (min)</span><input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="¿Cuánto tiempo estudiaste?" /></label>
          <div className="result-options">
            {[
              "Comprendí con ayuda",
              "Resolví ejercicios acompañado",
              "Pude resolver solo",
              "Completé el simulacro",
            ].map((result, index) => (
              <button
                key={result}
                disabled={saving}
                onClick={() => finishMission(result, index)}
              >
                <span>{index + 1}</span>
                {result}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {modal === "close" && (
        <Modal
          title="Cierre del día"
          eyebrow="Rendición de cuentas · 2 minutos"
          onClose={() => setModal(null)}
        >
          <div className="day-summary">
            <div><span>Misión principal</span><strong>{missionStatus === "done" ? "Cumplida" : missionStatus === "active" ? "En curso" : "Pendiente"}</strong></div>
            <div><span>No negociables registrados</span><strong>{completedHabits} de {activeMinimumItems.length}</strong></div>
            <div><span>XP de esfuerzo acumulado</span><strong>{totalXp} XP</strong></div>
          </div>
          <label className="field">
            <span>¿Qué te bloqueó o qué aprendiste?</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Una frase es suficiente."
            />
          </label>
          <button
            className="primary-action modal-primary full-button"
            disabled={saving}
            onClick={closeDay}
          >
            {saving ? "Guardando…" : "Confirmar cierre"}
          </button>
        </Modal>
      )}

      {modal === "recovery" && (
        <Modal title="Modo de día difícil" eyebrow="Recuperar sin abandonar" onClose={() => setModal(null)}>
          <p className="recovery-intro">
            Reduce la carga y elige una acción pequeña para retomar. Comer, dormir y recuperarte siguen siendo necesidades básicas, nunca premios.
          </p>
          <div className="recovery-plan">
            {activeMinimumItems.map((item) => <div key={item.id}><span>◇</span><strong>{item.title}</strong><small>{item.difficultDayVersion || item.description || item.goal}</small></div>)}
            {activeMinimumItems.length === 0 && <div><span>↺</span><strong>Una acción pequeña</strong><small>Elígela según tu situación real</small></div>}
          </div>
          <label className="field">
            <span>¿Qué está ocurriendo hoy?</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ej.: dormí muy poco y tengo un examen mañana." />
          </label>
          <button
            className="primary-action modal-primary full-button"
            disabled={saving}
            onClick={activateRecovery}
          >
            {saving ? "Activando…" : "Activar plan mínimo"}
          </button>
        </Modal>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

export default function Home() {
  return <Dashboard />;
}
