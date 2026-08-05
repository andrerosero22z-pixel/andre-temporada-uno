"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthScreen({ loading = false }: { loading?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function signInWithGoogle() {
    setGoogleLoading(true);
    setStatus("");
    try {
      const client = getSupabaseBrowserClient();
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          scopes: "openid email profile",
        },
      });
      if (error) throw error;
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "No pudimos iniciar sesión con Google.",
      );
      setGoogleLoading(false);
    }
  }

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
        <p className="eyebrow">Andre · Temporada Uno · V2 RPG</p>
        <h1>Tu progreso ahora sí será tuyo</h1>
        <p>
          Entra para guardar en Supabase tus materias, tareas, exámenes y
          no negociables. Las estadísticas de demostración se reemplazarán
          conforme registres acciones reales.
        </p>

        {loading ? (
          <div className="auth-loading" role="status">
            <span />
            Comprobando tu sesión…
          </div>
        ) : (
          <>
            <button
              className="google-button"
              disabled={googleLoading}
              onClick={signInWithGoogle}
              type="button"
            >
              <span aria-hidden="true">G</span>
              {googleLoading ? "Abriendo Google…" : "Continuar con Google"}
            </button>

            <div className="auth-divider">
              <span />
              <small>o entra por correo</small>
              <span />
            </div>

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
          </>
        )}

        {status && !loading && (
          <p className="auth-status" role="status">
            {status}
          </p>
        )}
        <small>
          Google solo se usa para identificarte. No pedimos acceso a Drive,
          Calendar ni a tus correos.
        </small>
      </section>
    </main>
  );
}
