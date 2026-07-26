"use client";

import { useMemo, useState } from "react";

type View = "today" | "studies" | "progress" | "journal";
type MissionStatus = "pending" | "active" | "done";
type TaskState = "today" | "upcoming" | "done";

type Task = {
  id: number;
  title: string;
  subject: string;
  due: string;
  type: "Tarea" | "Examen" | "Práctica";
  state: TaskState;
};

type Skill = {
  name: string;
  level: number;
  xp: number;
  next: number;
  evidence: string;
  focus: string;
};

type AttributeGroup = {
  name: string;
  level: number;
  icon: string;
  color: string;
  description: string;
  skills: Skill[];
};

const navItems: { id: View; label: string; icon: string }[] = [
  { id: "today", label: "Hoy", icon: "✦" },
  { id: "studies", label: "Planificador", icon: "▦" },
  { id: "progress", label: "Habilidades", icon: "⌁" },
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
    name: "Contratación Pública",
    kind: "Teórica",
    progress: 42,
    next: "Quiz · 30 jul",
    tasks: 2,
    color: "#d3ac66",
  },
  {
    name: "Inglés B1",
    kind: "Mixta",
    progress: 54,
    next: "Práctica · lunes",
    tasks: 1,
    color: "#a995cf",
  },
];

const attributeGroups: AttributeGroup[] = [
  {
    name: "Mente",
    level: 7,
    icon: "◈",
    color: "#8fa9d7",
    description: "Capacidad de analizar, razonar y resolver sin depender de ayuda.",
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
        name: "Pensamiento lógico",
        level: 8,
        xp: 310,
        next: 420,
        evidence: "12 retos independientes",
        focus: "Explicar por qué una solución funciona.",
      },
    ],
  },
  {
    name: "Carrera",
    level: 8,
    icon: "▤",
    color: "#d3ac66",
    description: "Dominio comprobado de materias y competencias universitarias.",
    skills: [
      {
        name: "Bases de Datos",
        level: 8,
        xp: 330,
        next: 450,
        evidence: "3 simulacros · 74% dominio",
        focus: "Transacciones y diseño sin ayuda.",
      },
      {
        name: "Contratación Pública",
        level: 6,
        xp: 175,
        next: 300,
        evidence: "4 quizzes · 29 conceptos",
        focus: "Distinguir base legal y etapas del procedimiento.",
      },
      {
        name: "Inglés B1",
        level: 6,
        xp: 205,
        next: 300,
        evidence: "11 prácticas · racha 5 días",
        focus: "Responder con más fluidez sin traducir palabra por palabra.",
      },
    ],
  },
  {
    name: "Físico",
    level: 6,
    icon: "⌁",
    color: "#b57d68",
    description: "Fuerza, resistencia y cuidado corporal medidos con acciones reales.",
    skills: [
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
    ],
  },
  {
    name: "Dinero",
    level: 4,
    icon: "◇",
    color: "#82a99b",
    description: "Decisiones financieras y crecimiento profesional verificables.",
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

const freeSkills: Skill[] = [
  {
    name: "Guitarra",
    level: 5,
    xp: 145,
    next: 240,
    evidence: "6 prácticas · 2 canciones",
    focus: "Tocar una canción completa sin detenerte.",
  },
  {
    name: "Programación",
    level: 7,
    xp: 285,
    next: 380,
    evidence: "4 proyectos · 16 prácticas",
    focus: "Construir una función completa sin copiar código.",
  },
  {
    name: "Comunicación",
    level: 6,
    xp: 165,
    next: 280,
    evidence: "8 escritos · 3 exposiciones",
    focus: "Explicar ideas complejas con orden y claridad.",
  },
];

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Simulacro de transacciones",
    subject: "Bases de Datos",
    due: "Hoy · 9:15 p. m.",
    type: "Práctica",
    state: "today",
  },
  {
    id: 2,
    title: "Repasar principios de la LOSNCP",
    subject: "Contratación Pública",
    due: "Hoy · 35 min",
    type: "Tarea",
    state: "today",
  },
  {
    id: 3,
    title: "Writing: plan de viaje",
    subject: "Inglés B1",
    due: "Lun 27 jul",
    type: "Tarea",
    state: "upcoming",
  },
  {
    id: 4,
    title: "Examen práctico",
    subject: "Bases de Datos",
    due: "Vie 31 jul · 8:00 a. m.",
    type: "Examen",
    state: "upcoming",
  },
  {
    id: 5,
    title: "Ejercicios de normalización",
    subject: "Bases de Datos",
    due: "Completado ayer",
    type: "Práctica",
    state: "done",
  },
];

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
  const [view, setView] = useState<View>("today");
  const [missionStatus, setMissionStatus] =
    useState<MissionStatus>("pending");
  const [habits, setHabits] = useState({
    prayer: true,
    hygiene: true,
    movement: false,
    planning: false,
    sleep: false,
  });
  const [modal, setModal] = useState<"quick" | "close" | "study" | null>(null);
  const [toast, setToast] = useState("");
  const [entryType, setEntryType] = useState("Sesión de estudio");
  const [note, setNote] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeAttribute, setActiveAttribute] = useState("Mente");
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

  function toggleHabit(key: keyof typeof habits) {
    setHabits((current) => ({ ...current, [key]: !current[key] }));
  }

  function toggleTask(id: number) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, state: task.state === "done" ? "today" : "done" }
          : task,
      ),
    );
  }

  function saveQuickEntry() {
    if (!note.trim()) {
      notify("Escribe una descripción breve antes de guardar.");
      return;
    }

    if (entryType === "Tarea" || entryType === "Examen") {
      setTasks((current) => [
        ...current,
        {
          id: Date.now(),
          title: note.trim(),
          subject: "Sin materia",
          due: taskDate || "Sin fecha",
          type: entryType,
          state: taskDate ? "upcoming" : "today",
        },
      ]);
    }

    setModal(null);
    setNote("");
    setTaskDate("");
    notify(`${entryType} registrada correctamente.`);
  }

  function selectAttribute(group: AttributeGroup) {
    setActiveAttribute(group.name);
    setSelectedSkill(group.skills[0]);
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
          <span className="profile-chip__avatar">A</span>
          <div>
            <strong>Andre</strong>
            <small>Nivel 12 · Aprendiz</small>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Sábado, 25 de julio</p>
            <h1>
              {view === "today" && "Buenas noches, Andre"}
              {view === "studies" && "Planificador"}
              {view === "progress" && "Árbol de habilidades"}
              {view === "journal" && "Diario de campaña"}
            </h1>
          </div>
          <div className="player-status">
            <div className="season-pill">Temporada 1 · Semana 1</div>
            <div className="level-badge">12</div>
            <div className="xp-summary">
              <span>Nivel global</span>
              <strong>340 / 500 XP</strong>
              <ProgressBar value={68} accent="var(--gold)" />
            </div>
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
                <h2>Bases de Datos:<br />simulacro práctico</h2>
                <p className="mission-copy">
                  Resuelve sin ayuda. Al terminar, registra en qué fallaste.
                </p>
                <div className="mission-meta">
                  <span>◷ <strong>45 min</strong></span>
                  <span>✦ <strong>+120 XP</strong></span>
                </div>
                <button
                  className={`primary-action ${
                    missionStatus === "active" ? "primary-action--active" : ""
                  }`}
                  onClick={startMission}
                >
                  {missionStatus === "pending" && "Iniciar misión"}
                  {missionStatus === "active" && "Finalizar misión"}
                  {missionStatus === "done" && "Misión cumplida"}
                  <span>→</span>
                </button>
              </div>
            </section>

            <aside className="today-rail">
              <section className="evaluation-card panel">
                <div className="card-icon">▦</div>
                <div>
                  <p className="eyebrow">Próxima evaluación</p>
                  <h3>Bases de Datos</h3>
                  <p className="evaluation-date">✦ Viernes · 8:00 a. m.</p>
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
                    <p className="eyebrow">Constancia diaria</p>
                    <h3>Hábitos de hoy</h3>
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
                            <small>{task.due}</small>
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
                <p className="eyebrow">Tu personaje · progreso verificable</p>
                <h2>Lo que sabes se convierte en habilidades.</h2>
                <p>
                  No calificamos “tu mente” a ojo. Practicar, resolver, crear y
                  demostrar dominio entrega XP a una habilidad concreta.
                </p>
              </div>
              <div className="overview-level">
                <span>12</span>
                <div>
                  <small>Nivel global</small>
                  <strong>11 habilidades activas</strong>
                </div>
              </div>
            </section>

            <section className="attribute-tabs" aria-label="Atributos principales">
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
                    <small>Atributo</small>
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

            <section className="free-skills panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Fuera del pénsum</p>
                  <h3>Habilidades libres</h3>
                </div>
                <span>{freeSkills.length}</span>
              </div>
              <p className="section-copy">
                También puedes subir habilidades que te importan aunque no
                pertenezcan a una materia.
              </p>
              <div className="free-skill-grid">
                {freeSkills.map((skill) => (
                  <SkillCard
                    key={skill.name}
                    skill={skill}
                    color="#a995cf"
                    onSelect={() => {
                      setSelectedSkill(skill);
                      notify(`${skill.name}: nivel ${skill.level}.`);
                    }}
                  />
                ))}
              </div>
            </section>

            <section className="measurement panel">
              <div className="measurement__icon">?</div>
              <div>
                <p className="eyebrow">Cómo se calcula</p>
                <h3>Nivel por evidencia, no por sensación.</h3>
                <p>
                  Una sesión entrega XP por constancia; un ejercicio independiente,
                  proyecto o examen aporta evidencia de dominio. El atributo grande
                  resume los niveles de sus habilidades. La fe y el propósito se
                  respetan como prácticas personales: no se reducen a un porcentaje.
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
            {["Sesión de estudio", "Tarea", "Examen", "Hábito", "Diario"].map((type) => (
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
            <label className="field field--date">
              <span>Fecha</span>
              <input
                type="date"
                value={taskDate}
                onChange={(event) => setTaskDate(event.target.value)}
              />
            </label>
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

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
