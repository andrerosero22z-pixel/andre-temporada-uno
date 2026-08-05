"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Compass, ShieldCheck } from "lucide-react";
import type { BodyMeasurement, DigitalWellbeing, HabitKey } from "@/lib/types";

export type OnboardingInput = {
  purpose: string;
  nonNegotiables: HabitKey[];
  subjects: string[];
  firstTask: string;
  startDate: string;
  body: Omit<BodyMeasurement, "recordedOn"> | null;
  screens: DigitalWellbeing | null;
};

const choices: Array<{ key: HabitKey; title: string; detail: string }> = [
  { key: "prayer", title: "Oración", detail: "Proteger un momento de fe" },
  { key: "hygiene", title: "Higiene básica", detail: "Cuidar lo esencial incluso en días difíciles" },
  { key: "movement", title: "Movimiento", detail: "Mantener el cuerpo activo" },
  { key: "planning", title: "Planificar el día", detail: "Elegir antes de reaccionar" },
  { key: "sleep", title: "Dormir a tiempo", detail: "Proteger descanso y recuperación" },
];

function localToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function numberOrNull(value: string) {
  return value.trim() === "" ? null : Number(value);
}

export function SeasonOnboarding({
  displayName,
  saving,
  onStart,
  onSignOut,
}: {
  displayName: string;
  saving: boolean;
  onStart: (input: OnboardingInput) => Promise<void>;
  onSignOut: () => void;
}) {
  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState("");
  const [selected, setSelected] = useState<HabitKey[]>([]);
  const [subjects, setSubjects] = useState("");
  const [firstTask, setFirstTask] = useState("");
  const [startDate, setStartDate] = useState(localToday());
  const [body, setBody] = useState({ weight: "", waist: "", fat: "", energy: "", sleep: "" });
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

  async function submit() {
    setError("");
    try {
      await onStart({
        purpose,
        nonNegotiables: selected,
        subjects: subjects.split(",").map((item) => item.trim()).filter(Boolean),
        firstTask,
        startDate,
        body: {
          weightKg: numberOrNull(body.weight),
          waistCm: numberOrNull(body.waist),
          bodyFatPercent: numberOrNull(body.fat),
          energyLevel: numberOrNull(body.energy),
          sleepHours: numberOrNull(body.sleep),
        },
        screens: {
          screenTimeMinutes: numberOrNull(screens.total),
          socialMediaMinutes: numberOrNull(screens.social),
          shortVideoMinutes: numberOrNull(screens.shortVideo),
          gamingMinutes: numberOrNull(screens.gaming),
          intentionalLeisureMinutes: numberOrNull(screens.leisure),
          stimulationFastMinutes: numberOrNull(screens.fast),
        },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo comenzar la temporada.");
    }
  }

  return (
    <main className="onboarding-shell">
      <section className="onboarding-card">
        <header className="onboarding-head">
          <div className="onboarding-brand"><Compass aria-hidden="true" /><span>Andre · Temporada Uno</span></div>
          <button type="button" onClick={onSignOut}>Salir</button>
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
          <label className="field"><span>Tu brújula (opcional)</span><textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="¿Qué clase de persona quieres construir y por qué?" /></label>
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
            <label className="field field--wide"><span>Materias actuales</span><input value={subjects} onChange={(event) => setSubjects(event.target.value)} placeholder="Cálculo, Estadística, Bases de Datos" /><small>Sepáralas con comas.</small></label>
            <label className="field field--wide"><span>Primera tarea o misión</span><input value={firstTask} onChange={(event) => setFirstTask(event.target.value)} placeholder="Ej. organizar los apuntes de Estadística" /></label>
            <div className="onboarding-subgroup field--wide"><strong>Línea base física</strong><small>Déjalo vacío si aún no tienes mediciones.</small></div>
            <label className="field"><span>Peso (kg)</span><input type="number" step=".1" value={body.weight} onChange={(event) => setBody({ ...body, weight: event.target.value })} placeholder="Por registrar" /></label>
            <label className="field"><span>Cintura (cm)</span><input type="number" step=".1" value={body.waist} onChange={(event) => setBody({ ...body, waist: event.target.value })} placeholder="Por registrar" /></label>
            <label className="field"><span>Grasa estimada (%)</span><input type="number" step=".1" value={body.fat} onChange={(event) => setBody({ ...body, fat: event.target.value })} placeholder="Por registrar" /></label>
            <label className="field"><span>Energía (1–5)</span><input type="number" min="1" max="5" value={body.energy} onChange={(event) => setBody({ ...body, energy: event.target.value })} placeholder="Por registrar" /></label>
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
          <label className="field"><span>Fecha de inicio</span><div className="date-field"><CalendarDays size={18} /><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div></label>
          <div className="onboarding-summary">
            <div><small>No negociables</small><strong>{selected.length ? selected.map((key) => choices.find((item) => item.key === key)?.title).join(" · ") : "Por configurar"}</strong></div>
            <div><small>Materias</small><strong>{subjects.trim() || "Por registrar"}</strong></div>
            <div><small>Primera misión</small><strong>{firstTask.trim() || "Por registrar"}</strong></div>
          </div>
        </div>}

        {error && <p className="onboarding-error" role="alert">{error}</p>}
        <footer className="onboarding-actions">
          <button className="ghost-action" type="button" disabled={step === 0 || saving} onClick={() => setStep((current) => current - 1)}><ArrowLeft size={16} /> Atrás</button>
          {step < steps.length - 1
            ? <button className="primary-action" type="button" onClick={() => setStep((current) => current + 1)}>Continuar <ArrowRight size={16} /></button>
            : <button className="primary-action" type="button" disabled={saving || !startDate} onClick={submit}>{saving ? "Preparando…" : "Comenzar Temporada 1"} <ArrowRight size={16} /></button>}
        </footer>
      </section>
    </main>
  );
}
