"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthScreen({ loading = false }: { loading?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(
    loading ? "Comprobando tu sesión…" : "",
  );
  const [sending, setSending] = useState(false);

  async function sendMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    setStatus("");
    try {
      const client = getSupabaseBrowserClient();
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setStatus("Revisa tu correo. Te enviamos un enlace para entrar.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "No pudimos enviar el enlace de acceso.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-mark" aria-hidden="true">
          ◆
        </div>
        <p className="eyebrow">Andre · Temporada Uno</p>
        <h1>Tu progreso ahora sí será tuyo</h1>
        <p>
          Entra para guardar en Supabase tus materias, tareas, exámenes y
          no negociables. Las estadísticas de demostración se reemplazarán
          conforme registres evidencia real.
        </p>

        {loading ? (
          <div className="auth-loading" role="status">
            <span />
            Comprobando tu sesión…
          </div>
        ) : (
          <form onSubmit={sendMagicLink}>
            <label>
              Correo
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@correo.com"
                autoComplete="email"
                required
              />
            </label>
            <button className="primary-button" disabled={sending} type="submit">
              {sending ? "Enviando…" : "Entrar con enlace seguro"}
            </button>
          </form>
        )}

        {status && !loading && (
          <p className="auth-status" role="status">
            {status}
          </p>
        )}
        <small>
          No necesitas crear otra contraseña. El enlace solo funciona durante
          unos minutos.
        </small>
      </section>
    </main>
  );
}
