"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Compass, ShieldCheck } from "lucide-react";
import type { HabitKey, SeasonSetupInput } from "@/lib/types";

export type OnboardingInput = SeasonSetupInput;

const choices: Array<{ key: HabitKey; title: string; detail: string }> = [
  { key: "prayer", title: "Oración", detail: "Proteger un momento de fe" },
  { key: "hygiene", title: "Higiene básica", detail: "Cuidar lo esencial incluso en días difíciles" },
  { key: "movement", title: "Movimiento", detail: "Mantener el cuerpo activo" },
  { key: "planning", title: "Planificar el día", detail: "Elegir antes de reaccionar" },
  { key: "sleep", title: "Dormir a tiempo", detail: "Proteger descanso y recuperación" },
];

function numberOrNull(value: string) {
  return value.trim() === "" ? null : Number(value);
}

export function SeasonOnboarding({
  open,
  displayName,
  initialPurpose,
  initialSeasonName,
  initialSeasonObjective,
  initialStartDate,
  initialCurrentSubjects,
  initialPlannedSubjects,
  initialNonNegotiables,
  suggestedStartDate,
  reviewMode,
  saving,
  onSaveDraft,
  onStart,
  onClose,
}: {
  open: boolean;
  displayName: string;
  initialPurpose: string;
  initialSeasonName: string;
  initialSeasonObjective: string;
  initialStartDate: string;
  initialCurrentSubjects: string[];
  initialPlannedSubjects: string[];
  initialNonNegotiables: HabitKey[];
  suggestedStartDate: string;
  reviewMode: boolean;
  saving: boolean;
  onSaveDraft: (input: OnboardingInput) => Promise<void>;
  onStart: (input: OnboardingInput) => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [seasonName, setSeasonName] = useState(initialSeasonName);
  const [seasonObjective, setSeasonObjective] = useState(initialSeasonObjective);
  const [purpose, setPurpose] = useState(initialPurpose);
  const [selected, setSelected] = useState<HabitKey[]>(initialNonNegotiables.slice(0, 3));
  const [currentSubjects, setCurrentSubjects] = useState(initialCurrentSubjects.join(", "));
  const [plannedSubjects, setPlannedSubjects] = useState(initialPlannedSubjects.join(", "));
  const [firstTask, setFirstTask] = useState("");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [scheduledActivity, setScheduledActivity] = useState({ title: "", subject: "", startDate: "", schedule: "" });
  const [futureGoal, setFutureGoal] = useState({ title: "", target: "", unit: "", reason: "", activation: "" });
  const [body, setBody] = useState({ height: "", weight: "", waist: "", fat: "", energy: "", sleep: "", context: "" });
  const [screens, setScreens] = useState({ total: "", social: "", shortVideo: "", gaming: "", leisure: "", fast: "" });
  const [error, setError] = useState("");
  const steps = useMemo(() => ["Cómo funciona", "Tus mínimos", "Punto de partida", "Confirmar"], []);

  function toggleChoice(key: HabitKey) {
    setError("");
    setSelected((current) => {
      if (current.includes(key)) return current.filter((item) => item !== key);
      if (current.length === 3) {
        setError("Elige como máximo tres. Puedes cambiar el resto después.");
        return current;
      }
      return [...current, key];
    });
  }

  function inputValue(): OnboardingInput {
    return {
        seasonName,
        seasonObjective,
        purpose,
        nonNegotiables: selected,
        currentSubjects: currentSubjects.split(",").map((item) => item.trim()).filter(Boolean),
        plannedSubjects: plannedSubjects.split(",").map((item) => item.trim()).filter(Boolean),
        firstTask,
        startDate,
        scheduledActivity: Object.values(scheduledActivity).some((value) => value.trim()) ? scheduledActivity : null,
        futureGoal: futureGoal.title.trim() ? {
          title: futureGoal.title,
          targetValue: numberOrNull(futureGoal.target),
          unit: futureGoal.unit,
          reason: futureGoal.reason,
          activationNote: futureGoal.activation,
        } : null,
        body: {
          heightCm: numberOrNull(body.height),
          weightKg: numberOrNull(body.weight),
          waistCm: numberOrNull(body.waist),
          bodyFatPercent: numberOrNull(body.fat),
          energyLevel: numberOrNull(body.energy),
          sleepHours: numberOrNull(body.sleep),
          context: body.context,
        },
        screens: {
          screenTimeMinutes: numberOrNull(screens.total),
          socialMediaMinutes: numberOrNull(screens.social),
          shortVideoMinutes: numberOrNull(screens.shortVideo),
          gamingMinutes: numberOrNull(screens.gaming),
          intentionalLeisureMinutes: numberOrNull(screens.leisure),
          stimulationFastMinutes: numberOrNull(screens.fast),
        },
      };
  }

  async function submit(mode: "draft" | "start") {
    setError("");
    try {
      const input = inputValue();
      if (mode === "draft") await onSaveDraft(input);
      else await onStart(input);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la preparación.");
    }
  }

  return (
    <div className="onboarding-shell" role="dialog" aria-modal="true" aria-label="Configurar Temporada 1" hidden={!open}>
      <section className="onboarding-card">
        <header className="onboarding-head">
          <div className="onboarding-brand"><Compass aria-hidden="true" /><span>Andre · Temporada Uno</span></div>
          <button type="button" onClick={onClose}>{reviewMode ? "Cerrar vista previa" : "Ahora no"}</button>
        </header>

        <div className="onboarding-progress" aria-label={`Paso ${step + 1} de ${steps.length}`}>
          {steps.map((label, index) => <span className={index <= step ? "is-active" : ""} key={label}><i>{index < step ? <Check size={13} /> : index + 1}</i><small>{label}</small></span>)}
        </div>

        {step === 0 && <div className="onboarding-step">
          <p className="eyebrow">En preparación</p>
          <h1>{displayName}, tu temporada empieza cuando tú lo confirmes.</h1>
          <p>Durante ocho semanas registrarás acciones reales, revisarás lo aprendido y ajustarás el camino. El sistema confía en lo que reportas: no exige fotografías ni comprobantes.</p>
          <div className="onboarding-principles">
            <article><ShieldCheck /><div><strong>Confianza primero</strong><small>Tu reporte honesto es un registro válido.</small></div></article>
            <article><Compass /><div><strong>Esfuerzo y dominio separados</strong><small>Practicar cuenta; dominar se construye gradualmente.</small></div></article>
          </div>
          <label className="field"><span>Nombre de la temporada</span><input value={seasonName} onChange={(event) => setSeasonName(event.target.value)} placeholder="Ej. El despertar" /></label>
          <label className="field"><span>Tu brújula (opcional)</span><textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="¿Qué clase de persona quieres construir y por qué?" /></label>
          <label className="field"><span>Objetivo de estas ocho semanas (opcional)</span><textarea value={seasonObjective} onChange={(event) => setSeasonObjective(event.target.value)} placeholder="¿Qué base quieres haber construido al cerrar la temporada?" /></label>
        </div>}

        {step === 1 && <div className="onboarding-step">
          <p className="eyebrow">Identidad protegida</p>
          <h1>Elige hasta tres no negociables.</h1>
          <p>Son mínimos para días normales y difíciles, no una lista de perfección. También puedes comenzar sin elegirlos y configurarlos después.</p>
          <div className="onboarding-choices">
            {choices.map((choice) => <button type="button" className={selected.includes(choice.key) ? "is-selected" : ""} onClick={() => toggleChoice(choice.key)} key={choice.key}><i>{selected.includes(choice.key) ? <Check size={17} /> : "◇"}</i><span><strong>{choice.title}</strong><small>{choice.detail}</small></span></button>)}
          </div>
          <small className="selection-count">{selected.length} de 3 seleccionados</small>
        </div>}

        {step === 2 && <div className="onboarding-step">
          <p className="eyebrow">Todo es opcional</p>
          <h1>Registra únicamente lo que ya sabes.</h1>
          <div className="onboarding-form-grid">
            <label className="field field--wide"><span>Actividades o materias actuales</span><input value={currentSubjects} onChange={(event) => setCurrentSubjects(event.target.value)} placeholder="Inglés, Estadística, Proyecto personal" /><small>Sepáralas con comas. Se guardan como activas.</small></label>
            <label className="field field--wide"><span>Materias futuras</span><textarea value={plannedSubjects} onChange={(event) => setPlannedSubjects(event.target.value)} placeholder="Materias del próximo semestre" /><small>Sepáralas con comas. Se guardan como planificadas.</small></label>
            <label className="field field--wide"><span>Primera tarea o misión</span><input value={firstTask} onChange={(event) => setFirstTask(event.target.value)} placeholder="Ej. organizar los apuntes de Estadística" /></label>
            <div className="onboarding-subgroup field--wide"><strong>Actividad con horario</strong><small>Opcional. Registra el comienzo y el horario; no exige una fecha final.</small></div>
            <label className="field"><span>Actividad</span><input value={scheduledActivity.title} onChange={(event) => setScheduledActivity({ ...scheduledActivity, title: event.target.value })} placeholder="Ej. Inglés virtual" /></label>
            <label className="field"><span>Materia o área</span><input value={scheduledActivity.subject} onChange={(event) => setScheduledActivity({ ...scheduledActivity, subject: event.target.value })} placeholder="Ej. Inglés virtual" /></label>
            <div className="field"><span>Fecha de inicio</span><div className="date-field"><CalendarDays size={18} /><input aria-label="Fecha de inicio de la actividad" type="date" value={scheduledActivity.startDate} onChange={(event) => setScheduledActivity({ ...scheduledActivity, startDate: event.target.value })} /><button type="button" disabled={!startDate} onClick={() => setScheduledActivity({ ...scheduledActivity, startDate })}>Usar inicio propuesto</button></div></div>
            <label className="field"><span>Horario</span><input value={scheduledActivity.schedule} onChange={(event) => setScheduledActivity({ ...scheduledActivity, schedule: event.target.value })} placeholder="Lunes a viernes, 18:00–20:00" /></label>
            <div className="onboarding-subgroup field--wide"><strong>Meta futura</strong><small>Opcional. Queda pausada y sin porcentaje hasta que decidas activarla.</small></div>
            <label className="field field--wide"><span>Meta</span><input value={futureGoal.title} onChange={(event) => setFutureGoal({ ...futureGoal, title: event.target.value })} placeholder="Ej. Promedio general" /></label>
            <label className="field"><span>Valor objetivo</span><input type="number" step=".1" value={futureGoal.target} onChange={(event) => setFutureGoal({ ...futureGoal, target: event.target.value })} placeholder="Por definir" /></label>
            <label className="field"><span>Unidad</span><input value={futureGoal.unit} onChange={(event) => setFutureGoal({ ...futureGoal, unit: event.target.value })} placeholder="Ej. sobre 40" /></label>
            <label className="field field--wide"><span>Por qué importa</span><textarea value={futureGoal.reason} onChange={(event) => setFutureGoal({ ...futureGoal, reason: event.target.value })} placeholder="Razón personal de la meta" /></label>
            <label className="field field--wide"><span>Cuándo se activará</span><input value={futureGoal.activation} onChange={(event) => setFutureGoal({ ...futureGoal, activation: event.target.value })} placeholder="Ej. Al comenzar el próximo semestre" /></label>
            <div className="onboarding-subgroup field--wide"><strong>Línea base física</strong><small>Déjalo vacío si aún no tienes mediciones.</small></div>
            <label className="field"><span>Estatura (cm)</span><input type="number" step=".1" value={body.height} onChange={(event) => setBody({ ...body, height: event.target.value })} placeholder="Por registrar" /></label>
            <label className="field"><span>Peso (kg)</span><input type="number" step=".1" value={body.weight} onChange={(event) => setBody({ ...body, weight: event.target.value })} placeholder="Por registrar" /></label>
            <label className="field"><span>Cintura (cm)</span><input type="number" step=".1" value={body.waist} onChange={(event) => setBody({ ...body, waist: event.target.value })} placeholder="Por registrar" /></label>
            <label className="field"><span>Grasa estimada (%)</span><input type="number" step=".1" value={body.fat} onChange={(event) => setBody({ ...body, fat: event.target.value })} placeholder="Por registrar" /></label>
            <label className="field"><span>Energía (1–5)</span><input type="number" min="1" max="5" value={body.energy} onChange={(event) => setBody({ ...body, energy: event.target.value })} placeholder="Por registrar" /></label>
            <label className="field field--wide"><span>Contexto de la medición</span><input value={body.context} onChange={(event) => setBody({ ...body, context: event.target.value })} placeholder="Opcional" /></label>
            <div className="onboarding-subgroup field--wide"><strong>Línea base de pantallas</strong><small>Minutos aproximados; no es un juicio moral.</small></div>
            <label className="field"><span>Celular total</span><input type="number" min="0" value={screens.total} onChange={(event) => setScreens({ ...screens, total: event.target.value })} placeholder="Por registrar" /></label>
            <label className="field"><span>Redes</span><input type="number" min="0" value={screens.social} onChange={(event) => setScreens({ ...screens, social: event.target.value })} placeholder="Por registrar" /></label>
            <label className="field"><span>Videos cortos</span><input type="number" min="0" value={screens.shortVideo} onChange={(event) => setScreens({ ...screens, shortVideo: event.target.value })} placeholder="Por registrar" /></label>
            <label className="field"><span>Videojuegos</span><input type="number" min="0" value={screens.gaming} onChange={(event) => setScreens({ ...screens, gaming: event.target.value })} placeholder="Por registrar" /></label>
          </div>
        </div>}

        {step === 3 && <div className="onboarding-step onboarding-confirm">
          <p className="eyebrow">Comenzar con intención</p>
          <h1>Confirma el inicio de tu primera temporada.</h1>
          <p>La Semana 1 se calculará desde esta fecha. Antes de confirmar, tu estado seguirá siendo “En preparación”.</p>
          <div className="field"><span>Fecha de inicio</span><div className="date-field"><CalendarDays size={18} /><input aria-label="Fecha de inicio" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /><button type="button" disabled={!suggestedStartDate} onClick={() => setStartDate(suggestedStartDate)}>Usar hoy</button></div></div>
          <div className="onboarding-summary">
            <div><small>No negociables</small><strong>{selected.length ? selected.map((key) => choices.find((item) => item.key === key)?.title).join(" · ") : "Por configurar"}</strong></div>
            <div><small>Temporada</small><strong>{seasonName.trim() || "Temporada 1"}</strong></div>
            <div><small>Actividades actuales</small><strong>{currentSubjects.trim() || "Por registrar"}</strong></div>
            <div><small>Materias futuras</small><strong>{plannedSubjects.trim() || "Por registrar"}</strong></div>
            <div><small>Primera misión</small><strong>{firstTask.trim() || "Por registrar"}</strong></div>
            <div><small>Meta futura</small><strong>{futureGoal.title.trim() || "Por registrar"}</strong></div>
          </div>
        </div>}

        {error && <p className="onboarding-error" role="alert">{error}</p>}
        <footer className="onboarding-actions">
          <button className="ghost-action" type="button" disabled={step === 0 || saving} onClick={() => setStep((current) => current - 1)}><ArrowLeft size={16} /> Atrás</button>
          {step < steps.length - 1
            ? <button className="primary-action" type="button" onClick={() => setStep((current) => current + 1)}>Continuar <ArrowRight size={16} /></button>
            : <div className="onboarding-action-group">
                <button className="ghost-action" type="button" disabled={saving} onClick={() => submit("draft")}>{saving ? "Guardando…" : "Guardar preparación"}</button>
                <button className="primary-action" type="button" disabled={saving || !startDate} onClick={() => submit("start")}>{saving ? "Preparando…" : "Comenzar Temporada 1"} <ArrowRight size={16} /></button>
              </div>}
        </footer>
      </section>
    </div>
  );
}
