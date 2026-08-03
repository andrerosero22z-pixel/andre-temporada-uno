"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  CalendarClock,
  CalendarDays,
  Clock3,
  Droplets,
  Dumbbell,
  FlagTriangleRight,
  Gamepad2,
  House,
  ListChecks,
  MessageCircleMore,
  MoonStar,
  PenLine,
  Play,
  Repeat2,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { AuthScreen } from "@/components/auth-screen";
import {
  createGoal,
  createHabit,
  createPlannerItem,
  loadDashboardData,
  saveBodyMeasurement,
  saveDigitalWellbeing,
  saveJournalEntry,
  saveStudySession,
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
  MissionStatus,
  Skill,
  StoredSkill,
  SubjectSummary,
  Task,
  TaskState,
  View,
} from "@/lib/types";

const navItems: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "today", label: "Hoy", icon: House },
  { id: "studies", label: "Planificador", icon: CalendarDays },
  { id: "progress", label: "Progreso", icon: TrendingUp },
  { id: "goals", label: "Metas", icon: Target },
  { id: "habits", label: "Hábitos", icon: Repeat2 },
  { id: "dopamine", label: "Dopamina", icon: BrainCircuit },
  { id: "journal", label: "Diario", icon: BookOpenText },
];

const minimumItems: { key: HabitKey; icon: LucideIcon; title: string; detail: string }[] = [
  { key: "prayer", icon: Sparkles, title: "Oración", detail: "10 minutos" },
  { key: "hygiene", icon: Droplets, title: "Higiene", detail: "Rutina completa" },
  { key: "movement", icon: Dumbbell, title: "Movimiento", detail: "20 minutos" },
  { key: "planning", icon: ListChecks, title: "Plan del día", detail: "Revisar pendientes" },
  { key: "sleep", icon: MoonStar, title: "Descanso", detail: "Dormir a tiempo" },
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
        name: "Nutrición",
        level: 4,
        xp: 115,
        next: 200,
        evidence: "8 días registrados",
        focus: "Mejorar la constancia de las comidas.",
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

function todayLabel() {
  return new Intl.DateTimeFormat("es-EC", {
    timeZone: "America/Guayaquil",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
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
        <button className="modal__close" onClick={onClose} aria-label="Cerrar">
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
  const progress = (skill.xp / skill.next) * 100;

  return (
    <button
      className={`skill-card ${selected ? "skill-card--selected" : ""}`}
      onClick={onSelect}
    >
      <div className="skill-card__head">
        <span className="skill-level" style={{ borderColor: color, color }}>
          {skill.level}
        </span>
        <span>
          <strong>{skill.name}</strong>
          <small>{skill.evidence}</small>
        </span>
        <i>→</i>
      </div>
      <div className="skill-xp">
        <span>{skill.xp} / {skill.next} XP</span>
        <span>Nivel {skill.level + 1}</span>
      </div>
      <ProgressBar value={progress} accent={color} small />
    </button>
  );
}

export default function Home() {
  const [authStatus, setAuthStatus] = useState<
    "checking" | "signed_in" | "signed_out"
  >("checking");
  const [userId, setUserId] = useState("");
  const [userLabel, setUserLabel] = useState("Andre");
  const [view, setView] = useState<View>("today");
  const [missionStatus, setMissionStatus] =
    useState<MissionStatus>("pending");
  const [habits, setHabits] = useState<HabitState>({
    prayer: false,
    hygiene: false,
    movement: false,
    planning: false,
    sleep: false,
  });
  const [habitIds, setHabitIds] = useState<HabitIds>({});
  const [modal, setModal] = useState<"quick" | "close" | "study" | "recovery" | null>(null);
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
  const [duration, setDuration] = useState("30");
  const [numberValue, setNumberValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [mood, setMood] = useState("3");
  const [studyMode, setStudyMode] = useState<"reading" | "guided" | "practice" | "independent" | "simulation">("practice");
  const [digitalForm, setDigitalForm] = useState({ screen: "", social: "", shortVideo: "", gaming: "", leisure: "", fast: "" });
  const [bodyForm, setBodyForm] = useState({ weight: "", waist: "", fat: "", energy: "", sleep: "" });

  const completedHabits = useMemo(
    () => Object.values(habits).filter(Boolean).length,
    [habits],
  );

  const realAttributeGroups = useMemo(() => attributeGroups.map((group) => {
    const skills = group.skills.map((skill) => {
      const stored = storedSkills.find((candidate) => candidate.name === skill.name);
      const xp = stored?.xp ?? 0;
      return {
        ...skill,
        level: Math.floor(xp / 100),
        xp: xp % 100,
        next: 100,
        evidence: stored?.evidenceCount
          ? `${stored.evidenceCount} evidencia${stored.evidenceCount === 1 ? "" : "s"}`
          : "Sin evidencia registrada",
      };
    });
    return { ...group, level: Math.floor(skills.reduce((sum, skill) => sum + skill.level, 0) / Math.max(1, skills.length)), skills };
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
  const globalLevel = Math.floor(totalXp / 500);
  const levelXp = totalXp % 500;
  const completedThisWeek = habitData.reduce(
    (sum, habit) => sum + habit.week.filter(Boolean).length,
    0,
  );
  const weeklyPossible = habitData.length * 7;
  const weeklyRate = weeklyPossible
    ? Math.round((completedThisWeek / weeklyPossible) * 100)
    : 0;
  const strongestHabit = [...habitData].sort((left, right) => right.streak - left.streak)[0];
  const weakestHabit = [...habitData].sort((left, right) => left.rate - right.rate)[0];
  const recentDigitalDays = digitalHistory.slice(-7);
  const recordedDigitalDays = recentDigitalDays.filter((day) => day.screenTimeMinutes !== null);
  const averageDigital = (key: keyof DigitalWellbeing) => {
    const values = recentDigitalDays
      .map((day) => day[key])
      .filter((value): value is number => value !== null);
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  };
  const rapidStimuliToday = (digitalWellbeing.socialMediaMinutes ?? 0) + (digitalWellbeing.shortVideoMinutes ?? 0);
  const classifiedScreenToday = rapidStimuliToday + (digitalWellbeing.gamingMinutes ?? 0);
  const unclassifiedScreenToday = Math.max(0, (digitalWellbeing.screenTimeMinutes ?? 0) - classifiedScreenToday);
  const attentionControlToday = digitalWellbeing.screenTimeMinutes === null
    ? null
    : digitalWellbeing.screenTimeMinutes === 0
      ? 100
      : Math.max(0, Math.min(100, Math.round(((digitalWellbeing.screenTimeMinutes - rapidStimuliToday) / digitalWellbeing.screenTimeMinutes) * 100)));
  const digitalInsight = digitalWellbeing.screenTimeMinutes === null
    ? "Registra al menos tres días para descubrir cuándo el celular te ayuda y cuándo empieza a dirigir tu atención."
    : rapidStimuliToday >= 90
      ? "Hoy los estímulos rápidos ocuparon una parte importante del día. Conviene proteger el siguiente bloque sin redes ni videos cortos."
      : rapidStimuliToday > 0
        ? "Ya tienes una línea base de estímulos rápidos. La meta no es cero pantalla: es que el uso sea elegido y no automático."
        : "Hoy no registraste redes ni videos cortos. Comprueba que el dato esté completo antes de sacar conclusiones.";
  const realLifeStats = [
    { name: "Disciplina", value: weeklyRate, detail: "Cumplimiento de hábitos y no negociables", change: weeklyPossible ? `${completedThisWeek} de ${weeklyPossible} esta semana` : "Sin registros", color: "#d3ac66" },
    { name: "Salud física", value: Math.round(((habitData.find((habit) => habit.title === "Movimiento")?.rate ?? 0) + (habitData.find((habit) => habit.title === "Dormir a tiempo")?.rate ?? 0)) / 2), detail: "Movimiento y descanso registrados", change: bodyMeasurement ? "Línea base registrada" : "Sin línea base", color: "#b98275" },
    { name: "Enfoque mental", value: 0, detail: "Se activará con sesiones de enfoque y varios días de pantallas", change: digitalWellbeing.screenTimeMinutes === null ? "Sin registro de hoy" : `${digitalWellbeing.screenTimeMinutes} min de celular`, color: "#8fa9d7" },
    { name: "Avance de carrera", value: subjectData.length ? Math.round((subjectData.filter((subject) => subject.status === "passed").length / subjectData.length) * 100) : 0, detail: "Materias aprobadas sobre materias registradas", change: subjectData.length ? `${subjectData.filter((subject) => subject.status === "passed").length} de ${subjectData.length} materias` : "Añade tu pénsum", color: "#9a8cc2" },
    { name: "Orden financiero", value: 0, detail: "Presupuesto, ahorro e ingresos", change: "Aún sin registros", color: "#c19b70" },
    { name: "Equilibrio personal", value: habitData.find((habit) => habit.title === "Oración")?.rate ?? 0, detail: "Fe, descanso y ocio intencional", change: digitalWellbeing.intentionalLeisureMinutes === null ? "Sin registro de ocio" : `${digitalWellbeing.intentionalLeisureMinutes} min intencionales`, color: "#7f9eb8" },
  ];
  const realBodyMetrics = [
    { label: "Peso", value: bodyMeasurement?.weightKg == null ? "Por registrar" : `${bodyMeasurement.weightKg} kg`, trend: "Línea base" },
    { label: "Cintura", value: bodyMeasurement?.waistCm == null ? "Por registrar" : `${bodyMeasurement.waistCm} cm`, trend: "Línea base" },
    { label: "Grasa estimada", value: bodyMeasurement?.bodyFatPercent == null ? "Por registrar" : `${bodyMeasurement.bodyFatPercent}%`, trend: "Meta personal" },
    { label: "Energía", value: bodyMeasurement?.energyLevel == null ? "Por registrar" : `${bodyMeasurement.energyLevel} / 5`, trend: bodyMeasurement?.recordedOn ?? "Línea base" },
  ];
  const plannerDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const iso = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    const parts = new Intl.DateTimeFormat("es-EC", { timeZone: "America/Guayaquil", weekday: "short", day: "numeric" }).formatToParts(date);
    return {
      iso,
      day: parts.find((part) => part.type === "weekday")?.value ?? "",
      date: parts.find((part) => part.type === "day")?.value ?? "",
      count: tasks.filter((task) => task.dueDate === iso && task.state !== "done").length,
      active: index === 0,
    };
  }), [tasks]);

  function applyDashboardData(data: DashboardData) {
    setTasks(data.tasks);
    setHabits(data.checkins);
    setHabitIds(data.ids);
    setSubjectData(data.subjects);
    setGoalData(data.goals);
    setBodyMeasurement(data.bodyMeasurement);
    setJournalData(data.journalEntries);
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

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function loadRealData() {
      try {
        const client = getSupabaseBrowserClient();
        const data = await loadDashboardData(client, userId);
        if (cancelled) return;

        applyDashboardData(data);
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
      notify("Misión iniciada. Enfoque total durante 45 minutos.");
    } else if (missionStatus === "active") {
      setModal("study");
    } else {
      notify("Esta misión ya está cumplida.");
    }
  }

  async function toggleHabit(key: HabitKey) {
    const habitId = habitIds[key];
    if (!userId || !habitId) {
      notify("El hábito todavía no está listo. Recarga e inténtalo de nuevo.");
      return;
    }
    const completed = !habits[key];
    setHabits((current) => ({ ...current, [key]: completed }));
    try {
      await setHabitCheckin(
        getSupabaseBrowserClient(),
        userId,
        habitId,
        completed,
      );
    } catch {
      setHabits((current) => ({ ...current, [key]: !completed }));
      notify("No se pudo guardar el no negociable. Inténtalo otra vez.");
    }
  }

  async function toggleTask(id: string) {
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
    if (!userId) {
      notify("Tu sesión expiró. Vuelve a entrar.");
      return;
    }
    if (entryType !== "Pantallas" && entryType !== "Medición" && !note.trim()) {
      notify("Escribe una descripción breve antes de guardar.");
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
          durationMinutes: Math.max(1, Number(duration) || 0),
          mode: studyMode,
          notes: note.trim(),
        });
      } else if (entryType === "Hábito") {
        await createHabit(client, userId, {
          title: note.trim(),
          targetAmount: Math.max(1, Number(targetValue) || 1),
          unit: unit.trim() || "vez",
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
          weightKg: numberOrNull(bodyForm.weight),
          waistCm: numberOrNull(bodyForm.waist),
          bodyFatPercent: numberOrNull(bodyForm.fat),
          energyLevel: numberOrNull(bodyForm.energy),
          sleepHours: numberOrNull(bodyForm.sleep),
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
      }
      await refreshData();
      setModal(null);
      setNote("");
      setTaskDate("");
      setTaskSubject("");
      setNumberValue("");
      setTargetValue("");
      setUnit("");
      notify(`${entryType} guardado correctamente.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  function selectAttribute(group: AttributeGroup) {
    setActiveAttribute(group.name);
    setSelectedSkillName(group.skills[0].name);
  }

  async function saveJournal() {
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
    if (!primaryTask) return;
    setSaving(true);
    try {
      await saveStudySession(getSupabaseBrowserClient(), userId, {
        subject: primaryTask.subject,
        skillName: selectedSkill.name,
        durationMinutes: 45,
        mode: index === 3 ? "simulation" : index === 2 ? "independent" : index === 0 ? "guided" : "practice",
        notes: result,
      });
      await setPlannerItemCompleted(getSupabaseBrowserClient(), primaryTask, true);
      await refreshData();
      setMissionStatus("done");
      setModal(null);
      notify("Misión y evidencia guardadas.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo cerrar la misión.");
    } finally {
      setSaving(false);
    }
  }

  async function closeDay() {
    setSaving(true);
    try {
      const summary = note.trim() || `Cierre del día: ${completedHabits} de 5 no negociables.`;
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
    setSaving(true);
    try {
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      await createPlannerItem(getSupabaseBrowserClient(), userId, {
        title: "Plan mínimo: oración, higiene, 20 min de estudio y 10 min de movimiento",
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
    await getSupabaseBrowserClient().auth.signOut();
  }

  if (authStatus !== "signed_in") {
    return <AuthScreen loading={authStatus === "checking"} />;
  }

  return (
    <main className="app-shell">
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
          <small>Semana 1 de 8</small>
        </div>

        <div className="profile-chip">
          <span className="profile-chip__avatar">
            {userLabel.charAt(0).toUpperCase()}
          </span>
          <div>
            <strong>{userLabel}</strong>
            <small>Nivel {globalLevel} · Inicio real</small>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{todayLabel()}</p>
            <h1>
              {view === "today" && "Buenas noches, Andre"}
              {view === "studies" && "Planificador"}
              {view === "progress" && "Mapa de progreso"}
              {view === "goals" && "Metas"}
              {view === "habits" && "Hábitos"}
              {view === "dopamine" && "Atención"}
              {view === "journal" && "Diario"}
            </h1>
          </div>
          <div className="player-status">
            {dataStatus === "error" && <span className="data-status data-status--error">Sin conexión</span>}
            <div className="season-pill">Temporada 1 · Semana 1</div>
            <div className="level-badge">{globalLevel}</div>
            <div className="xp-summary">
              <span>Nivel global</span>
              <strong>{levelXp} / 500 XP</strong>
              <ProgressBar value={(levelXp / 500) * 100} accent="var(--gold)" />
            </div>
            <button className="sign-out" onClick={signOut} type="button">
              Salir
            </button>
          </div>
        </header>

        {view === "today" && (
          <div className="dashboard">
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
                <div className="mission-meta">
                  <span><Clock3 aria-hidden="true" /> <strong>45 min</strong></span>
                  <span><Sparkles aria-hidden="true" /> <strong>XP según evidencia</strong></span>
                </div>
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
                  <div className="preparation-row">
                    <span>Preparación comprobada</span>
                    <strong>0 de 5 fases</strong>
                  </div>
                  <ProgressBar value={0} accent="var(--gold)" small />
                </div>
              </section>

              <section className="minimums-card panel">
                <div className="section-heading">
                  <div>
                  <p className="eyebrow">Identidad protegida</p>
                  <h3>No negociables de hoy</h3>
                  </div>
                  <span>{completedHabits}/5</span>
                </div>
                <div className="minimum-list">
                  {minimumItems.map(({ key, icon: Icon, title, detail }) => {
                    const done = habits[key];
                    return (
                      <button
                        key={key}
                        className={done ? "minimum minimum--done" : "minimum"}
                        onClick={() => toggleHabit(key)}
                      >
                        <span className="minimum__icon"><Icon aria-hidden="true" size={18} strokeWidth={1.8} /></span>
                        <span><strong>{title}</strong><small>{detail}</small></span>
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
                    <span className="tag">{subject.status === "passed" ? "Aprobada" : "En curso"}</span>
                  </div>
                  <h3>{subject.name}</h3>
                  <p>{subject.nextItem} · {subject.pendingItems} pendientes</p>
                  <div className="subject-card__progress">
                    <span>Dominio comprobado</span>
                    <strong>{subject.progress}%</strong>
                  </div>
                  <ProgressBar value={subject.progress} accent="#8fa9d7" small />
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
                <span>{globalLevel}</span>
                <div>
                  <small>Nivel global</small>
                  <strong>{storedSkills.length} habilidades con evidencia</strong>
                </div>
              </div>
            </section>

            <section className="purpose-card panel">
              <span className="purpose-card__compass">✦</span>
              <div>
                <p className="eyebrow">Disciplina</p>
                <h3>La disciplina de hoy evita el arrepentimiento de mañana.</h3>
                <p>Crecer con Dios · dominar Ciencia de Datos · vivir con dominio propio.</p>
              </div>
            </section>

            <section className="life-state panel">
              <div className="section-heading life-state__heading">
                <div>
                  <p className="eyebrow">Barras generales</p>
                  <h3>Estado de tu vida</h3>
                </div>
                <span>Esta semana</span>
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
                      <span style={{ color: stat.color }}>{stat.value}</span>
                    </div>
                    <ProgressBar value={stat.value} accent={stat.color} />
                    <p>{stat.change}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="career-progress panel">
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
                    <strong>{realLifeStats[3].value}%</strong>
                  </div>
                  <ProgressBar value={realLifeStats[3].value} accent="#9a8cc2" />
                  <small>{subjectData.filter((subject) => subject.status === "passed").length} aprobadas · {subjectData.filter((subject) => subject.status === "studying").length} cursando · {subjectData.filter((subject) => subject.status === "pending").length} pendientes</small>
                </div>
              </div>
              <div className="term-card">
                <span>Periodo actual</span>
                <strong>{subjectData.filter((subject) => subject.status === "studying").length} materias</strong>
                <div><small>Sin pendientes</small><b>{subjectData.filter((subject) => subject.status === "studying" && subject.pendingItems === 0).length}</b></div>
                <div><small>Con pendientes</small><b className="warning-text">{subjectData.filter((subject) => subject.status === "studying" && subject.pendingItems > 0).length}</b></div>
                <div><small>Próxima evaluación</small><b>{nextExam ? formatTaskDate(nextExam.dueDate, nextExam.state) : "Ninguna"}</b></div>
              </div>
            </section>

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
                  <i>Nv. {group.level}</i>
                </button>
              ))}
            </section>

            <section className="skill-workbench">
              <div className="skill-group panel">
                <div className="skill-group__head">
                  <div>
                    <p className="eyebrow" style={{ color: activeGroup.color }}>
                      Nivel {activeGroup.level}
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
                    {selectedSkill.level}
                  </span>
                  <div>
                    <h3>{selectedSkill.name}</h3>
                    <small>Nivel {selectedSkill.level}</small>
                  </div>
                </div>
                <div className="skill-detail__xp">
                  <div>
                    <span>Camino al nivel {selectedSkill.level + 1}</span>
                    <strong>{selectedSkill.xp} / {selectedSkill.next} XP</strong>
                  </div>
                  <ProgressBar
                    value={(selectedSkill.xp / selectedSkill.next) * 100}
                    accent={activeGroup.color}
                  />
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
                <h3>Nivel por evidencia, no por sensación.</h3>
                <p>
                  Una sesión entrega XP por constancia; un ejercicio independiente,
                  proyecto o examen aporta evidencia de dominio. Las barras generales
                  resumen comportamiento real; las habilidades conservan su propio
                  nivel. La fe y el propósito se respetan como prácticas personales.
                </p>
              </div>
            </section>
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
                    <b>0%</b>
                  </div>
                  <h3>{goal.title}</h3>
                  <div className="goal-values">
                    <div><small>Situación actual</small><strong>{goal.currentValue ?? "Por registrar"} {goal.currentValue == null ? "" : goal.unit}</strong></div>
                    <span>→</span>
                    <div><small>Resultado</small><strong>{goal.targetValue ?? "Por definir"} {goal.targetValue == null ? "" : goal.unit}</strong></div>
                  </div>
                  <ProgressBar value={0} accent="#d3ac66" />
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
                  cuidado, fuerza y constancia. El 12% primero necesita una línea base y un plazo saludable.
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
                  <span>0/8</span>
                </div>
                <ProgressBar value={0} accent="var(--gold)" />
                <div className="season-bosses">
                  <div><span>Jefe académico</span><strong>{nextExam?.title ?? "Por definir"}</strong><small>{nextExam ? formatTaskDate(nextExam.dueDate, nextExam.state) : "Sin examen"}</small></div>
                  <div><span>Desafío físico</span><strong>Por definir</strong><small>0 completados</small></div>
                  <div><span>Desafío de carácter</span><strong>7 cierres diarios</strong><small>{journalData.length} registrados</small></div>
                </div>
              </article>
              <article className="rewards-card panel">
                <div className="rewards-card__head"><div><p className="eyebrow">Recompensas</p><h3>Botín ganado</h3></div><span>◇ {coins}</span></div>
                <div className="reward-list">
                  <button disabled><span>☕</span><div><strong>Salida o comida especial</strong><small>400 monedas</small></div><i>Bloqueada</i></button>
                  <button disabled><span>✦</span><div><strong>Título: Aprendiz constante</strong><small>Racha de 7 días</small></div><i>Bloqueado</i></button>
                  <button disabled><span>◈</span><div><strong>Noche libre sin culpa</strong><small>Cierre semanal ≥ 80%</small></div><i>Bloqueada</i></button>
                </div>
              </article>
            </section>

            <section className="review-recovery">
              <article className="review-card panel">
                <div><p className="eyebrow">Revisión semanal · domingo</p><h3>Mirar, aprender y ajustar.</h3><p>Compara metas, hábitos, energía y resultados. Después elige una mejora concreta.</p></div>
                <div className="review-score"><span>{weeklyRate}%</span><small>semana actual</small></div>
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
                <span>{weeklyRate}%</span>
                <small>cumplimiento semanal</small>
                <b>{weeklyPossible ? `${completedThisWeek} registros` : "Sin datos"}</b>
              </div>
            </section>

            <section className="habit-summary-grid">
              <article className="habit-kpi panel">
                <small>Racha más fuerte</small>
                <strong>{strongestHabit?.streak ?? 0} días</strong>
                <span>{strongestHabit?.title ?? "Sin registros"}</span>
              </article>
              <article className="habit-kpi panel">
                <small>Esta semana</small>
                <strong>{completedThisWeek} / {weeklyPossible}</strong>
                <span>registros cumplidos</span>
              </article>
              <article className="habit-kpi panel">
                <small>Mayor oportunidad</small>
                <strong>{weakestHabit?.title ?? "Sin datos"}</strong>
                <span>{weakestHabit?.rate ?? 0}% en 28 días</span>
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
                <div className="bar-chart" aria-label="Tendencia de cumplimiento de hábitos">
                  {heatmapData.slice(-habitPeriod).map((count, index) => {
                    const value = habitData.length ? Math.round((count / habitData.length) * 100) : 0;
                    return (
                    <div className="bar-chart__column" key={`${value}-${index}`}>
                      <span style={{ height: `${value}%` }} />
                      <small>{index % 2 === 0 ? index + 1 : ""}</small>
                    </div>
                  );})}
                </div>
                <div className="chart-note">
                  <span><i className="legend-dot" /> Cumplimiento</span>
                  <strong>Promedio: {weeklyRate}%</strong>
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
                <div className="habit-heatmap" aria-label="Actividad de los últimos 28 días">
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
                </div>
                <div className="heatmap-legend">
                  <span>Menos</span>
                  {[0, 1, 2, 3].map((level) => (
                    <i className={`heat-cell heat-cell--${level}`} key={level} />
                  ))}
                  <span>Más</span>
                </div>
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
                    <div><span>◆</span><strong>{item.title}</strong><b>{item.rate}%</b></div>
                    <small>Mínimo diario</small>
                    <p>{item.streak ? `Racha actual: ${item.streak} días.` : "Todavía sin racha."}</p>
                    <ProgressBar value={item.rate} accent={item.rate < 75 ? "#b98275" : "#d3ac66"} small />
                  </article>
                ))}
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
                  <span>{habit.goal}</span>
                  <div className="week-dots" aria-label={`Últimos 7 días de ${habit.title}`}>
                    {habit.week.map((done, index) => (
                      <i className={done ? "week-dot week-dot--done" : "week-dot"} key={index}>
                        {done ? "✓" : ""}
                      </i>
                    ))}
                  </div>
                  <span><b>{habit.streak}</b> días</span>
                  <div className="rate-cell">
                    <ProgressBar value={habit.rate} accent={habit.rate < 60 ? "#b98275" : "#8fa9d7"} small />
                    <b>{habit.rate}%</b>
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

        {view === "dopamine" && (
          <div className="content-view dopamine-view">
            <section className="dopamine-hero panel">
              <div className="dopamine-hero__copy">
                <p className="eyebrow">Atención</p>
                <h2>Entrena tu atención.</h2>
                <p>Mide celular, estímulos rápidos, ocio elegido y bloques sin pantallas.</p>
                <button className="primary-action" onClick={() => { setEntryType("Pantallas"); setModal("quick"); }}>
                  Registrar el día
                </button>
              </div>
              <div className="attention-orbit" aria-hidden="true">
                <span className="attention-orbit__ring" />
                <span className="attention-orbit__ring attention-orbit__ring--two" />
                <strong>{attentionControlToday ?? "—"}</strong>
                <small>% control</small>
              </div>
            </section>

            <section className="dopamine-metric-grid">
              {digitalMetricCards.map(({ key, label, detail, icon: Icon }) => (
                <article className="dopamine-metric panel" key={key}>
                  <span><Icon aria-hidden="true" size={18} strokeWidth={1.7} /></span>
                  <div><small>{label}</small><strong>{digitalWellbeing[key] ?? 0} min</strong><p>{detail}</p></div>
                </article>
              ))}
            </section>

            <section className="attention-grid">
              <article className="attention-chart panel">
                <div className="section-heading">
                  <div><p className="eyebrow">Últimos 7 días</p><h3>Mapa de consumo digital</h3></div>
                  <span>{recordedDigitalDays.length}/7 registrados</span>
                </div>
                <div className="digital-chart" role="img" aria-label="Comparación de tiempo de celular y estímulos rápidos en los últimos siete días">
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
                </div>
                <div className="digital-chart__legend"><span><i /> Celular total</span><span><b /> Redes + videos cortos</span></div>
              </article>

              <article className="attention-balance panel">
                <p className="eyebrow">Lectura de hoy</p>
                <h3>Balance de atención</h3>
                <div className="attention-balance__rows">
                  <div className="attention-balance__positive"><span>Control de atención</span><strong>{attentionControlToday == null ? "—" : `${attentionControlToday}%`}</strong><small>Porción del celular fuera de redes y videos cortos</small></div>
                  <div><span>Estímulos rápidos</span><strong>{rapidStimuliToday} min</strong><small>Redes + videos cortos</small></div>
                  <div><span>Gaming</span><strong>{digitalWellbeing.gamingMinutes ?? 0} min</strong><small>Entretenimiento interactivo</small></div>
                  <div><span>Uso sin clasificar</span><strong>{unclassifiedScreenToday} min</strong><small>Estudio, mensajes, utilidades u otros</small></div>
                  <div><span>Ocio intencional</span><strong>{digitalWellbeing.intentionalLeisureMinutes ?? 0} min</strong><small>Descanso elegido conscientemente</small></div>
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
                  <div><dt>Celular</dt><dd>{averageDigital("screenTimeMinutes")} min/día</dd></div>
                  <div><dt>Estímulos rápidos</dt><dd>{averageDigital("socialMediaMinutes") + averageDigital("shortVideoMinutes")} min/día</dd></div>
                  <div><dt>Ocio elegido</dt><dd>{averageDigital("intentionalLeisureMinutes")} min/día</dd></div>
                  <div><dt>Ayuno de estímulos</dt><dd>{averageDigital("stimulationFastMinutes")} min/día</dd></div>
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
                <strong>{digitalWellbeing.stimulationFastMinutes ?? 0}<small> min</small></strong>
                <ProgressBar value={Math.min(100, ((digitalWellbeing.stimulationFastMinutes ?? 0) / 120) * 100)} accent="var(--emerald)" />
                <div><span>30 <small>reinicio</small></span><span>60 <small>bloque limpio</small></span><span>120 <small>reto profundo</small></span></div>
              </div>
            </section>

            <section className="campaign-library">
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
            </section>
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
      </section>

      <nav className="mobile-nav" aria-label="Navegación móvil">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={view === item.id ? "mobile-nav__active" : ""}
              onClick={() => setView(item.id)}
            >
              <span><Icon aria-hidden="true" size={18} strokeWidth={1.8} /></span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {modal === "quick" && (
        <Modal
          title="Registrar algo"
          eyebrow="Captura rápida"
          onClose={() => setModal(null)}
        >
          <div className="segmented segmented--five">
            {["Sesión de estudio", "Tarea", "Examen", "Hábito", "Meta", "Medición", "Pantallas", "Diario"].map((type) => (
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
                      : "Describe brevemente la evidencia real."
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
                  <input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} />
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
          {entryType === "Hábito" && (
            <div className="field-row">
              <label className="field"><span>Meta diaria</span><input type="number" min="1" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} placeholder="1" /></label>
              <label className="field"><span>Unidad</span><input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="vez, min, páginas…" /></label>
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
              <label className="field"><span>Peso (kg)</span><input type="number" step=".1" value={bodyForm.weight} onChange={(event) => setBodyForm((current) => ({ ...current, weight: event.target.value }))} /></label>
              <label className="field"><span>Cintura (cm)</span><input type="number" step=".1" value={bodyForm.waist} onChange={(event) => setBodyForm((current) => ({ ...current, waist: event.target.value }))} /></label>
              <label className="field"><span>Grasa estimada (%)</span><input type="number" step=".1" value={bodyForm.fat} onChange={(event) => setBodyForm((current) => ({ ...current, fat: event.target.value }))} /></label>
              <label className="field"><span>Energía (1–5)</span><input type="number" min="1" max="5" value={bodyForm.energy} onChange={(event) => setBodyForm((current) => ({ ...current, energy: event.target.value }))} /></label>
              <label className="field"><span>Sueño (horas)</span><input type="number" step=".1" min="0" value={bodyForm.sleep} onChange={(event) => setBodyForm((current) => ({ ...current, sleep: event.target.value }))} /></label>
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

      {modal === "study" && (
        <Modal
          title="¿Cómo estudiaste realmente?"
          eyebrow="Cierre de misión"
          onClose={() => setModal(null)}
        >
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
            <div><span>Hábitos registrados</span><strong>{completedHabits} de 5</strong></div>
            <div><span>XP total comprobado</span><strong>{totalXp} XP</strong></div>
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
            El sistema reduce el día a cuatro mínimos y pausa las misiones secundarias.
            La misión principal solo se conserva si tiene una fecha crítica.
          </p>
          <div className="recovery-plan">
            <div><span>☼</span><strong>Oración</strong><small>5 min</small></div>
            <div><span>♢</span><strong>Higiene básica</strong><small>Rutina esencial</small></div>
            <div><span>▦</span><strong>Estudio mínimo</strong><small>20 min</small></div>
            <div><span>↗</span><strong>Movimiento</strong><small>10 min</small></div>
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
