"use client";

import { useMemo, useState } from "react";

type View = "today" | "studies" | "progress" | "journal";
type MissionStatus = "pending" | "active" | "done";

const navItems: { id: View; label: string; icon: string }[] = [
  { id: "today", label: "Hoy", icon: "✦" },
  { id: "studies", label: "Estudios", icon: "◇" },
  { id: "progress", label: "Progreso", icon: "↗" },
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
    color: "#55b889",
  },
  {
    name: "Contratación Pública",
    kind: "Teórica",
    progress: 42,
    next: "Quiz · 30 jul",
    color: "#d8b76d",
  },
  {
    name: "Inglés B1",
    kind: "Mixta",
    progress: 54,
    next: "Práctica · lunes",
    color: "#78a9ca",
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
  accent = "var(--emerald)",
  small = false,
}: {
  value: number;
  accent?: string;
  small?: boolean;
}) {
  return (
    <div
      className={`progress-track ${small ? "progress-track--small" : ""}`}
      aria-label={`${value}% completado`}
    >
      <span
        className="progress-fill"
        style={{ width: `${value}%`, background: accent }}
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

export default function Home() {
  const [view, setView] = useState<View>("today");
  const [missionStatus, setMissionStatus] =
    useState<MissionStatus>("pending");
  const [minimums, setMinimums] = useState({
    prayer: true,
    hygiene: true,
    movement: false,
  });
  const [modal, setModal] = useState<"quick" | "close" | "study" | null>(null);
  const [toast, setToast] = useState("");
  const [entryType, setEntryType] = useState("Sesión de estudio");
  const [note, setNote] = useState("");

  const completedMinimums = useMemo(
    () => Object.values(minimums).filter(Boolean).length,
    [minimums],
  );

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

  function toggleMinimum(key: keyof typeof minimums) {
    setMinimums((current) => ({ ...current, [key]: !current[key] }));
  }

  function saveQuickEntry() {
    if (!note.trim()) {
      notify("Escribe una nota breve antes de guardar.");
      return;
    }
    setModal(null);
    setNote("");
    notify(`${entryType} registrada correctamente.`);
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
              {view === "studies" && "Mapa de estudios"}
              {view === "progress" && "Tu progreso"}
              {view === "journal" && "Diario de campaña"}
            </h1>
          </div>
          <div className="player-status">
            <div className="season-pill">Temporada 1 · Semana 1</div>
            <div className="level-badge">12</div>
            <div className="xp-summary">
              <span>Nivel 12</span>
              <strong>340 / 500 XP</strong>
              <ProgressBar value={68} />
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
                    <span>Preparación</span>
                    <strong>68%</strong>
                  </div>
                  <ProgressBar value={68} accent="var(--gold)" small />
                </div>
              </section>

              <section className="minimums-card panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Proteger incluso en exámenes</p>
                    <h3>Mínimos de hoy</h3>
                  </div>
                  <span>{completedMinimums}/3</span>
                </div>
                <div className="minimum-list">
                  <button
                    className={minimums.prayer ? "minimum minimum--done" : "minimum"}
                    onClick={() => toggleMinimum("prayer")}
                  >
                    <span className="minimum__icon">☼</span>
                    <span><strong>Oración</strong><small>10 minutos</small></span>
                    <i>{minimums.prayer ? "✓" : ""}</i>
                  </button>
                  <button
                    className={minimums.hygiene ? "minimum minimum--done" : "minimum"}
                    onClick={() => toggleMinimum("hygiene")}
                  >
                    <span className="minimum__icon">♢</span>
                    <span><strong>Higiene</strong><small>Rutina completa</small></span>
                    <i>{minimums.hygiene ? "✓" : ""}</i>
                  </button>
                  <button
                    className={minimums.movement ? "minimum minimum--done" : "minimum"}
                    onClick={() => toggleMinimum("movement")}
                  >
                    <span className="minimum__icon">↗</span>
                    <span><strong>Movimiento</strong><small>20 minutos</small></span>
                    <i>{minimums.movement ? "✓" : ""}</i>
                  </button>
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
            <section className="view-intro panel">
              <div>
                <p className="eyebrow">Sistema académico</p>
                <h2>No basta con entender: hay que demostrar dominio.</h2>
                <p>
                  Tus evaluaciones avanzan desde el diagnóstico hasta un
                  simulacro sin ayuda. El sistema conserva el siguiente paso.
                </p>
              </div>
              <button className="secondary-action" onClick={() => setModal("quick")}>
                + Nueva evaluación
              </button>
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
                  <p>{subject.next}</p>
                  <div className="subject-card__progress">
                    <span>Dominio actual</span>
                    <strong>{subject.progress}%</strong>
                  </div>
                  <ProgressBar value={subject.progress} accent={subject.color} small />
                  <button
                    onClick={() =>
                      notify(`Abriste la ruta de ${subject.name}.`)
                    }
                  >
                    Ver ruta <span>→</span>
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
          <div className="content-view">
            <section className="stats-grid">
              <article className="stat-card panel">
                <small>XP esta semana</small>
                <strong>620</strong>
                <span className="positive">↑ 18% vs. anterior</span>
              </article>
              <article className="stat-card panel">
                <small>Misiones cumplidas</small>
                <strong>14/18</strong>
                <span>78% de cumplimiento</span>
              </article>
              <article className="stat-card panel">
                <small>Práctica independiente</small>
                <strong>3 h 20</strong>
                <span>La métrica que más importa</span>
              </article>
            </section>

            <section className="attributes panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Tu personaje</p>
                  <h3>Atributos de la temporada</h3>
                </div>
                <span>Nivel 12</span>
              </div>
              {[
                ["Conocimiento y estudios", 74, "#d8b76d"],
                ["Disciplina y carácter", 61, "#55b889"],
                ["Físico y salud", 46, "#78a9ca"],
                ["Fe y propósito", 70, "#b7a0db"],
              ].map(([label, value, color]) => (
                <div className="attribute-row" key={label as string}>
                  <div>
                    <strong>{label}</strong>
                    <span>{value}%</span>
                  </div>
                  <ProgressBar value={value as number} accent={color as string} small />
                </div>
              ))}
            </section>

            <section className="weekly-lesson panel">
              <span className="lesson-icon">✦</span>
              <div>
                <p className="eyebrow">Lectura del sistema</p>
                <h3>Comprendes rápido, pero compruebas tarde.</h3>
                <p>
                  Esta semana tu siguiente mejora no es estudiar más horas:
                  reserva el simulacro desde el primer día de preparación.
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
          <div className="segmented">
            {["Sesión de estudio", "Tarea", "Examen", "Diario"].map((type) => (
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
            <span>¿Qué ocurrió?</span>
            <textarea
              autoFocus
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ej.: Estudié una hora de transacciones; entendí, pero todavía no resolví solo."
            />
          </label>
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
                      ? "Misión cumplida: +120 XP."
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
            <div><span>Mínimos protegidos</span><strong>{completedMinimums} de 3</strong></div>
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
