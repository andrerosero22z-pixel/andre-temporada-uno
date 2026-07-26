"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthScreen } from "@/components/auth-screen";
import {
  createPlannerItem,
  loadDashboardData,
  setHabitCheckin,
  setPlannerItemCompleted,
} from "@/lib/supabase/dashboard";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  AttributeGroup,
  HabitIds,
  HabitKey,
  HabitState,
  MissionStatus,
  Skill,
  Task,
  TaskState,
  View,
} from "@/lib/types";

const navItems: { id: View; label: string; icon: string }[] = [
  { id: "today", label: "Hoy", icon: "✦" },
  { id: "studies", label: "Planificador", icon: "▦" },
  { id: "progress", label: "Progreso", icon: "⌁" },
  { id: "goals", label: "Metas", icon: "◎" },
  { id: "habits", label: "Hábitos", icon: "◌" },
  { id: "journal", label: "Diario", icon: "✎" },
];

const phases = [
  { label: "Diagnóstico", state: "done" },
  { label: "Comprensión", state: "done" },
  { label: "Práctica guiada", state: "done" },
  { label: "Práctica solo", state: "active" },
  { label: "Simulacro", state: "pending" },
];

const subjects = [
  {
    name: "Bases de Datos",
    kind: "Práctica",
    progress: 68,
    next: "Examen · viernes",
    tasks: 3,
    color: "#83a8d8",
  },
  {
    name: "Probabilidad y Estadística",
    kind: "Mixta",
    progress: 46,
    next: "Taller · 30 jul",
    tasks: 2,
    color: "#d3ac66",
  },
  {
    name: "Programación con Python",
    kind: "Práctica",
    progress: 57,
    next: "Proyecto · lunes",
    tasks: 1,
    color: "#a995cf",
  },
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

const lifeStats = [
  {
    name: "Disciplina",
    value: 73,
    detail: "Cumplimiento, puntualidad y recuperaciones",
    change: "+6 esta semana",
    color: "#d3ac66",
  },
  {
    name: "Salud física",
    value: 61,
    detail: "Sueño, movimiento, entrenamiento y nutrición",
    change: "+3 esta semana",
    color: "#b98275",
  },
  {
    name: "Enfoque mental",
    value: 67,
    detail: "Bloques profundos, descansos y saturación",
    change: "+4 esta semana",
    color: "#8fa9d7",
  },
  {
    name: "Avance de carrera",
    value: 56,
    detail: "Materias aprobadas y periodo actual",
    change: "18 de 32 materias",
    color: "#9a8cc2",
  },
  {
    name: "Orden financiero",
    value: 48,
    detail: "Registro, presupuesto, ahorro e ingresos",
    change: "+8 este mes",
    color: "#c19b70",
  },
  {
    name: "Equilibrio personal",
    value: 70,
    detail: "Fe, descanso, relaciones y tiempo propio",
    change: "estable",
    color: "#7f9eb8",
  },
];

const habitRows = [
  { name: "Oración", goal: "Diario", streak: 8, rate: 86, week: [1, 1, 1, 1, 1, 0, 1] },
  { name: "Higiene completa", goal: "Diario", streak: 6, rate: 93, week: [1, 1, 1, 1, 1, 1, 0] },
  { name: "Estudio profundo", goal: "5× semana", streak: 4, rate: 78, week: [1, 1, 0, 1, 1, 0, 1] },
  { name: "Entrenamiento", goal: "4× semana", streak: 2, rate: 64, week: [1, 0, 1, 0, 1, 0, 0] },
  { name: "Dormir a tiempo", goal: "5× semana", streak: 3, rate: 57, week: [0, 1, 1, 0, 1, 0, 1] },
];

const heatmap = [
  1, 2, 2, 1, 0, 2, 1,
  2, 1, 2, 2, 1, 0, 1,
  2, 2, 1, 3, 2, 1, 0,
  3, 2, 2, 3, 2, 2, 1,
];

const goals = [
  {
    title: "Llegar al 12% de grasa corporal",
    area: "Físico · composición corporal",
    current: "Medición inicial pendiente",
    target: "12%",
    date: "Fecha por definir",
    progress: 8,
    color: "#b98275",
    next: "Registrar peso, cintura y estimación inicial antes de fijar el ritmo.",
    checkpoints: ["Medición inicial", "18%", "15%", "12%"],
  },
  {
    title: "Cerrar bien el semestre",
    area: "Carrera · Ciencia de Datos",
    current: "3 materias al día",
    target: "5 aprobadas",
    date: "Fin del periodo",
    progress: 60,
    color: "#9a8cc2",
    next: "Proteger el simulacro de Bases de Datos del viernes.",
    checkpoints: ["Diagnóstico", "Práctica", "Simulacros", "Evaluaciones"],
  },
  {
    title: "Publicar un caso de portafolio",
    area: "Dinero y trabajo",
    current: "Dataset elegido",
    target: "Proyecto publicado",
    date: "Temporada 1",
    progress: 32,
    color: "#c19b70",
    next: "Terminar la limpieza y documentar las decisiones.",
    checkpoints: ["Pregunta", "Limpieza", "Análisis", "Publicación"],
  },
];

const bodyMetrics = [
  { label: "Peso", value: "Por registrar", trend: "Línea base" },
  { label: "Cintura", value: "Por registrar", trend: "Línea base" },
  { label: "Grasa estimada", value: "Por registrar", trend: "Meta: 12%" },
  { label: "Energía", value: "6.8 / 10", trend: "+0.6 este mes" },
];

const nonNegotiables = [
  { name: "Oración", minimum: "5 minutos", purpose: "Volver a la brújula incluso en un día difícil.", rate: 93 },
  { name: "Higiene básica", minimum: "Rutina esencial", purpose: "No abandonar el cuidado personal en exámenes.", rate: 96 },
  { name: "Estudio mínimo", minimum: "20 minutos", purpose: "Mantener el contacto con la materia aunque el plan falle.", rate: 84 },
  { name: "Movimiento", minimum: "10 minutos", purpose: "Evitar convertir un día ocupado en abandono total.", rate: 71 },
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

const journalEntries = [
  {
    date: "Hoy · 8:40 p. m.",
    title: "Lo que aprendí",
    body: "Entendí mejor las transacciones. Todavía necesito resolver un ejercicio completo sin mirar el procedimiento.",
    tag: "Estudio",
  },
  {
    date: "Ayer · 10:12 p. m.",
    title: "Un día imperfecto, no perdido",
    body: "No fui al gimnasio, pero cumplí el bloque principal y preparé lo necesario para mañana.",
    tag: "Reflexión",
  },
];

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
  const [dataStatus, setDataStatus] = useState<"loading" | "ready" | "error">("loading");
  const [activeAttribute, setActiveAttribute] = useState("Ciencia de Datos");
  const [selectedSkill, setSelectedSkill] = useState<Skill>(
    attributeGroups[0].skills[0],
  );

  const completedHabits = useMemo(
    () => Object.values(habits).filter(Boolean).length,
    [habits],
  );

  const activeGroup =
    attributeGroups.find((group) => group.name === activeAttribute) ??
    attributeGroups[0];
  const primaryTask =
    tasks.find((task) => task.state === "today") ??
    tasks.find((task) => task.state === "upcoming");
  const nextExam = tasks.find(
    (task) => task.type === "Examen" && task.state !== "done",
  );

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

        setTasks(data.tasks);
        setHabits(data.checkins);
        setHabitIds(data.ids);
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
    if (!note.trim()) {
      notify("Escribe una descripción breve antes de guardar.");
      return;
    }

    if (entryType === "Tarea" || entryType === "Examen") {
      if (!userId) {
        notify("Tu sesión expiró. Vuelve a entrar.");
        return;
      }
      try {
        const data = await createPlannerItem(
          getSupabaseBrowserClient(),
          userId,
          {
            title: note.trim(),
            subject: taskSubject.trim() || "General",
            dueDate: taskDate || null,
            type: entryType,
          },
        );
        setTasks(data.tasks);
        setHabits(data.checkins);
        setHabitIds(data.ids);
      } catch (error) {
        notify(error instanceof Error ? error.message : "No se pudo guardar.");
        return;
      }
    } else {
      notify("Este tipo de registro se conectará en la siguiente etapa.");
      return;
    }

    setModal(null);
    setNote("");
    setTaskDate("");
    setTaskSubject("");
    notify(`${entryType} registrada correctamente.`);
  }

  function selectAttribute(group: AttributeGroup) {
    setActiveAttribute(group.name);
    setSelectedSkill(group.skills[0]);
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
          {navItems.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "nav-item nav-item--active" : "nav-item"}
              onClick={() => setView(item.id)}
            >
              <span className="nav-item__icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
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
            <small>Nivel 12 · Aprendiz</small>
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
              {view === "goals" && "Metas y evolución"}
              {view === "habits" && "Seguimiento de hábitos"}
              {view === "journal" && "Diario de campaña"}
            </h1>
          </div>
          <div className="player-status">
            <span className={`data-status data-status--${dataStatus}`}>
              {dataStatus === "ready"
                ? "Supabase · núcleo real"
                : dataStatus === "loading"
                  ? "Cargando"
                  : "Sin conexión"}
            </span>
            <div className="season-pill">Temporada 1 · Semana 1</div>
            <div className="level-badge">12</div>
            <div className="xp-summary">
              <span>Nivel global</span>
              <strong>340 / 500 XP</strong>
              <ProgressBar value={68} accent="var(--gold)" />
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
                <span className="mission-glyph">◆</span>
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
                  <span>◷ <strong>45 min</strong></span>
                  <span>✦ <strong>+120 XP</strong></span>
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
                  <span>→</span>
                </button>
              </div>
            </section>

            <aside className="today-rail">
              <section className="evaluation-card panel">
                <div className="card-icon">▦</div>
                <div>
                  <p className="eyebrow">Próxima evaluación</p>
                  <h3>{nextExam?.title ?? "Sin examen registrado"}</h3>
                  <p className="evaluation-date">
                    ✦ {nextExam
                      ? `${nextExam.subject} · ${formatTaskDate(nextExam.dueDate, nextExam.state)}`
                      : "Añádelo en el Planificador"}
                  </p>
                  <div className="preparation-row">
                    <span>Preparación comprobada</span>
                    <strong>3 de 5 fases</strong>
                  </div>
                  <ProgressBar value={60} accent="var(--gold)" small />
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
                  {[
                    ["prayer", "☼", "Oración", "10 minutos"],
                    ["hygiene", "♢", "Higiene", "Rutina completa"],
                    ["movement", "↗", "Movimiento", "20 minutos"],
                    ["planning", "▦", "Plan del día", "Revisar pendientes"],
                    ["sleep", "☾", "Descanso", "Dormir a tiempo"],
                  ].map(([key, icon, title, detail]) => {
                    const done = habits[key as keyof typeof habits];
                    return (
                      <button
                        key={key}
                        className={done ? "minimum minimum--done" : "minimum"}
                        onClick={() => toggleHabit(key as keyof typeof habits)}
                      >
                        <span className="minimum__icon">{icon}</span>
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
              <span className="quick-card__icon">✎</span>
              <span>
                <small>Captura rápida</small>
                <strong>Registrar algo</strong>
              </span>
              <i>→</i>
            </button>
            <button className="close-day panel" onClick={() => setModal("close")}>
              <span>☾</span>
              <strong>Cerrar el día</strong>
              <small>2 min</small>
            </button>
          </div>
        )}

        {view === "studies" && (
          <div className="content-view">
            <section className="planner-header panel">
              <div>
                <p className="eyebrow">Tareas, exámenes y prácticas</p>
                <h2>Todo lo académico, sin llenar veinte campos.</h2>
                <p>
                  Registra lo que debes hacer, ponle fecha y el sistema conserva
                  el siguiente paso de preparación.
                </p>
              </div>
              <div className="planner-actions">
                <button
                  className="ghost-action calendar-action"
                  onClick={() =>
                    notify("La sincronización con calendario llegará al conectar tus datos reales.")
                  }
                >
                  ◫ Calendario
                  <small>Próximamente</small>
                </button>
                <button className="secondary-action" onClick={() => setModal("quick")}>
                  + Registrar
                </button>
              </div>
            </section>

            <section className="week-strip panel" aria-label="Resumen semanal">
              {[
                ["Sáb", "25", "2", true],
                ["Dom", "26", "1", false],
                ["Lun", "27", "3", false],
                ["Mar", "28", "1", false],
                ["Mié", "29", "2", false],
                ["Jue", "30", "2", false],
                ["Vie", "31", "Examen", false],
              ].map(([day, date, count, active]) => (
                <button
                  key={day as string}
                  className={active ? "week-day week-day--active" : "week-day"}
                  onClick={() => notify(`Agenda del ${day} ${date}.`)}
                >
                  <small>{day}</small>
                  <strong>{date}</strong>
                  <span>{count}</span>
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
              {subjects.map((subject) => (
                <article className="subject-card panel" key={subject.name}>
                  <div className="subject-card__top">
                    <span className="subject-rune" style={{ color: subject.color }}>
                      ◆
                    </span>
                    <span className="tag">{subject.kind}</span>
                  </div>
                  <h3>{subject.name}</h3>
                  <p>{subject.next} · {subject.tasks} pendientes</p>
                  <div className="subject-card__progress">
                    <span>Dominio comprobado</span>
                    <strong>{subject.progress}%</strong>
                  </div>
                  <ProgressBar value={subject.progress} accent={subject.color} small />
                  <button onClick={() => notify(`Abriste ${subject.name}.`)}>
                    Abrir materia <span>→</span>
                  </button>
                </article>
              ))}
            </section>

            <section className="path-card panel">
              <div className="path-card__heading">
                <div>
                  <p className="eyebrow">Bases de Datos · examen del viernes</p>
                  <h3>Ruta de preparación</h3>
                </div>
                <span>3 de 5 fases</span>
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
            </section>
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
                <span>12</span>
                <div>
                  <small>Nivel global</small>
                  <strong>15 habilidades activas</strong>
                </div>
              </div>
            </section>

            <section className="purpose-card panel">
              <span className="purpose-card__compass">✦</span>
              <div>
                <p className="eyebrow">Propósito · la brújula, no una nota</p>
                <h3>Crecer con Dios, terminar Ciencia de Datos y construir una vida con dominio propio.</h3>
                <p>
                  El propósito orienta las decisiones y temporadas. No sube ni
                  baja como si tu fe o tu valor personal fueran un porcentaje.
                </p>
              </div>
              <button
                className="ghost-action"
                onClick={() => notify("Aquí podrás editar tu propósito y tus principios.")}
              >
                Editar brújula
              </button>
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
                {lifeStats.map((stat) => (
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
                    <strong>56%</strong>
                  </div>
                  <ProgressBar value={56} accent="#9a8cc2" />
                  <small>18 aprobadas · 5 cursando · 9 pendientes</small>
                </div>
              </div>
              <div className="term-card">
                <span>Periodo actual</span>
                <strong>5 materias</strong>
                <div><small>Al día</small><b>3</b></div>
                <div><small>En riesgo</small><b className="warning-text">1</b></div>
                <div><small>Próxima evaluación</small><b>5 días</b></div>
                <em>Datos de ejemplo para el prototipo</em>
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
              {attributeGroups.map((group) => (
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
                      onSelect={() => setSelectedSkill(skill)}
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
                <p className="eyebrow">Resultados con dirección</p>
                <h2>Las metas convierten tu propósito en algo que sí puedes alcanzar.</h2>
                <p>
                  Cada meta separa el resultado, la situación actual, los checkpoints
                  y el siguiente paso. Los hábitos sostienen el proceso; la meta indica hacia dónde vas.
                </p>
              </div>
              <button className="secondary-action" onClick={() => { setEntryType("Meta"); setModal("quick"); }}>
                + Nueva meta
              </button>
            </section>

            <section className="goal-grid">
              {goals.map((goal) => (
                <article className="goal-card panel" key={goal.title}>
                  <div className="goal-card__top">
                    <span style={{ color: goal.color }}>◎</span>
                    <small>{goal.area}</small>
                    <b>{goal.progress}%</b>
                  </div>
                  <h3>{goal.title}</h3>
                  <div className="goal-values">
                    <div><small>Situación actual</small><strong>{goal.current}</strong></div>
                    <span>→</span>
                    <div><small>Resultado</small><strong>{goal.target}</strong></div>
                  </div>
                  <ProgressBar value={goal.progress} accent={goal.color} />
                  <div className="checkpoint-row">
                    {goal.checkpoints.map((checkpoint, index) => (
                      <span
                        className={index / (goal.checkpoints.length - 1) <= goal.progress / 100
                          ? "checkpoint checkpoint--reached"
                          : "checkpoint"}
                        key={checkpoint}
                      >
                        <i /><small>{checkpoint}</small>
                      </span>
                    ))}
                  </div>
                  <div className="goal-next"><small>Siguiente movimiento</small><p>{goal.next}</p></div>
                  <footer>
                    <span>◷ {goal.date}</span>
                    <button onClick={() => notify(`Abriste el plan de “${goal.title}”.`)}>Ver plan →</button>
                  </footer>
                </article>
              ))}
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
                {bodyMetrics.map((metric) => (
                  <article key={metric.label}>
                    <small>{metric.label}</small><strong>{metric.value}</strong><span>{metric.trend}</span>
                  </article>
                ))}
              </div>
              <div className="body-trend">
                <div className="body-trend__head"><span>Evolución mensual</span><small>Se activará con tus mediciones</small></div>
                <div className="body-trend__chart">
                  {[34, 37, 36, 44, 49, 55, 61, 68].map((value, index) => <i key={index} style={{ height: `${value}%` }} />)}
                </div>
              </div>
            </section>

            <section className="season-and-rewards">
              <article className="season-card panel">
                <p className="eyebrow">Temporada 1 · 8 semanas</p>
                <div className="season-card__title">
                  <div><h3>El despertar</h3><p>Recuperar dominio en estudios, cuerpo y rutina.</p></div>
                  <span>1/8</span>
                </div>
                <ProgressBar value={12.5} accent="var(--gold)" />
                <div className="season-bosses">
                  <div><span>Jefe académico</span><strong>Examen de Bases</strong><small>Viernes</small></div>
                  <div><span>Desafío físico</span><strong>4 entrenamientos</strong><small>1 de 4</small></div>
                  <div><span>Desafío de carácter</span><strong>7 cierres diarios</strong><small>2 de 7</small></div>
                </div>
              </article>
              <article className="rewards-card panel">
                <div className="rewards-card__head"><div><p className="eyebrow">Recompensas</p><h3>Botín ganado</h3></div><span>◇ 340</span></div>
                <div className="reward-list">
                  <button onClick={() => notify("Recompensa bloqueada: faltan 60 monedas.")}><span>☕</span><div><strong>Salida o comida especial</strong><small>400 monedas</small></div><i>Bloqueada</i></button>
                  <button onClick={() => notify("Título equipado: Aprendiz constante.")}><span>✦</span><div><strong>Título: Aprendiz constante</strong><small>Racha de 7 días</small></div><i>Ganado</i></button>
                  <button onClick={() => notify("Se desbloquea al cerrar la semana.")}><span>◈</span><div><strong>Noche libre sin culpa</strong><small>Cierre semanal ≥ 80%</small></div><i>En progreso</i></button>
                </div>
              </article>
            </section>

            <section className="review-recovery">
              <article className="review-card panel">
                <div><p className="eyebrow">Revisión semanal · domingo</p><h3>Mirar, aprender y ajustar.</h3><p>Compara metas, hábitos, energía y resultados. Después elige una mejora concreta.</p></div>
                <div className="review-score"><span>76%</span><small>semana actual</small></div>
                <button onClick={() => notify("La revisión semanal se abrirá con tus datos reales.")}>Iniciar revisión →</button>
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
                <span>83%</span>
                <small>cumplimiento semanal</small>
                <b>↑ 7 puntos</b>
              </div>
            </section>

            <section className="habit-summary-grid">
              <article className="habit-kpi panel">
                <small>Racha más fuerte</small>
                <strong>8 días</strong>
                <span>Oración</span>
              </article>
              <article className="habit-kpi panel">
                <small>Esta semana</small>
                <strong>29 / 35</strong>
                <span>registros cumplidos</span>
              </article>
              <article className="habit-kpi panel">
                <small>Mayor oportunidad</small>
                <strong>Dormir</strong>
                <span>57% en 30 días</span>
              </article>
              <article className="habit-kpi panel">
                <small>Recuperaciones</small>
                <strong>2</strong>
                <span>sin romper la temporada</span>
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
                    <button onClick={() => notify("Vista semanal activa.")}>7 días</button>
                    <button className="period-tabs__active">4 semanas</button>
                    <button onClick={() => notify("Vista de 3 meses disponible con datos reales.")}>3 meses</button>
                  </div>
                </div>
                <div className="bar-chart" aria-label="Tendencia de cumplimiento de hábitos">
                  {[54, 61, 58, 68, 72, 76, 83, 79, 86, 82, 88, 84].map((value, index) => (
                    <div className="bar-chart__column" key={`${value}-${index}`}>
                      <span style={{ height: `${value}%` }} />
                      <small>{index % 2 === 0 ? index + 1 : ""}</small>
                    </div>
                  ))}
                </div>
                <div className="chart-note">
                  <span><i className="legend-dot" /> Cumplimiento</span>
                  <strong>Promedio: 76%</strong>
                </div>
              </article>

              <article className="heatmap-card panel">
                <div className="chart-heading">
                  <div>
                    <p className="eyebrow">Mapa de constancia</p>
                    <h3>Últimos 28 días</h3>
                  </div>
                  <span className="small-badge">Mejorando</span>
                </div>
                <div className="habit-heatmap" aria-label="Actividad de los últimos 28 días">
                  {heatmap.map((intensity, index) => (
                    <button
                      key={index}
                      className={`heat-cell heat-cell--${intensity}`}
                      aria-label={`Día ${index + 1}: intensidad ${intensity}`}
                      onClick={() => notify(`Día ${index + 1}: ${intensity + 2} hábitos cumplidos.`)}
                    />
                  ))}
                </div>
                <div className="heatmap-legend">
                  <span>Menos</span>
                  {[0, 1, 2, 3].map((level) => (
                    <i className={`heat-cell heat-cell--${level}`} key={level} />
                  ))}
                  <span>Más</span>
                </div>
                <p>
                  Tus mejores días aparecen cuando planificas la noche anterior.
                  El sueño sigue siendo el punto que más arrastra el promedio.
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
                {nonNegotiables.map((item) => (
                  <article key={item.name}>
                    <div><span>◆</span><strong>{item.name}</strong><b>{item.rate}%</b></div>
                    <small>Mínimo: {item.minimum}</small>
                    <p>{item.purpose}</p>
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
              {habitRows.map((habit) => (
                <article className="habit-row" key={habit.name}>
                  <strong>{habit.name}</strong>
                  <span>{habit.goal}</span>
                  <div className="week-dots" aria-label={`Últimos 7 días de ${habit.name}`}>
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
                <h3>No necesitas más hábitos; necesitas proteger las noches.</h3>
                <p>
                  Cuando duermes tarde, al día siguiente bajan estudio, movimiento
                  y planificación. La próxima misión de disciplina será cerrar pantallas
                  a una hora definida, no añadir otra casilla.
                </p>
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
                  onClick={() => {
                    if (note.trim()) {
                      setNote("");
                      notify("Entrada guardada en tu diario.");
                    } else {
                      notify("Escribe primero una reflexión breve.");
                    }
                  }}
                >
                  Guardar reflexión
                </button>
              </div>
            </section>
            <section className="reflection-cycles panel">
              <p className="eyebrow">Ciclos de revisión</p>
              <h3>No solo registrar: interpretar y corregir.</h3>
              <div>
                <button onClick={() => notify("Revisión semanal preparada para el domingo.")}>
                  <span>7 días</span><strong>Revisión semanal</strong><small>Hábitos, metas, energía y una decisión</small>
                </button>
                <button onClick={() => notify("La revisión mensual necesita cuatro semanas de datos.")}>
                  <span>30 días</span><strong>Revisión mensual</strong><small>Tendencias, resultados y nuevo enfoque</small>
                </button>
              </div>
            </section>
            <section className="journal-list">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Bitácora</p>
                  <h3>Entradas recientes</h3>
                </div>
              </div>
              {journalEntries.map((entry) => (
                <article className="journal-entry panel" key={entry.date}>
                  <div>
                    <span className="tag">{entry.tag}</span>
                    <small>{entry.date}</small>
                  </div>
                  <h3>{entry.title}</h3>
                  <p>{entry.body}</p>
                </article>
              ))}
            </section>
          </div>
        )}
      </section>

      <nav className="mobile-nav" aria-label="Navegación móvil">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={view === item.id ? "mobile-nav__active" : ""}
            onClick={() => setView(item.id)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {modal === "quick" && (
        <Modal
          title="Registrar algo"
          eyebrow="Captura rápida"
          onClose={() => setModal(null)}
        >
          <div className="segmented segmented--five">
            {["Sesión de estudio", "Tarea", "Examen", "Hábito", "Meta", "Medición", "Diario"].map((type) => (
              <button
                key={type}
                className={entryType === type ? "segmented__active" : ""}
                onClick={() => setEntryType(type)}
              >
                {type}
              </button>
            ))}
          </div>
          <label className="field">
            <span>¿Qué quieres registrar?</span>
            <textarea
              autoFocus
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={
                entryType === "Tarea" || entryType === "Examen"
                  ? "Ej.: Resolver taller de normalización"
                  : "Ej.: Practiqué guitarra 35 minutos y completé una canción."
              }
            />
          </label>
          {(entryType === "Tarea" || entryType === "Examen") && (
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
              <label className="field field--date">
                <span>Fecha</span>
                <input
                  type="date"
                  value={taskDate}
                  onChange={(event) => setTaskDate(event.target.value)}
                />
              </label>
            </div>
          )}
          <div className="modal__actions">
            <button className="ghost-action" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button className="primary-action modal-primary" onClick={saveQuickEntry}>
              Guardar registro
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
                onClick={() => {
                  setMissionStatus("done");
                  setModal(null);
                  notify(
                    index >= 2
                      ? "Misión cumplida: +120 XP y evidencia de dominio."
                      : "Avance guardado. Mañana practicarás sin ayuda.",
                  );
                }}
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
            <div><span>XP provisional</span><strong>+{missionStatus === "done" ? 170 : 50} XP</strong></div>
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
            onClick={() => {
              setModal(null);
              setNote("");
              notify("Día cerrado. Mañana comenzamos con claridad.");
            }}
          >
            Confirmar cierre
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
            onClick={() => { setModal(null); setNote(""); notify("Modo de día difícil activado. Protege los cuatro mínimos."); }}
          >
            Activar plan mínimo
          </button>
        </Modal>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
