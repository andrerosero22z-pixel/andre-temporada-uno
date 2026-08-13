# Andre: Temporada Uno

Sistema personal gamificado para organizar estudios, hábitos, metas y reportes
de progreso. La aplicación está pensada primero para Andre y se publica como
una web instalable en Vercel.

Producción: <https://andre-temporada-uno.vercel.app>

## Estado actual

Ya usan datos reales de Supabase:

- Acceso con Google o mediante enlace seguro enviado al correo.
- Materias creadas desde el planificador.
- Tareas.
- Exámenes y otras evaluaciones.
- No negociables del día.
- Sesiones de estudio y evidencia de habilidades.
- Metas y mediciones corporales.
- Hábitos personalizados e historial de 28 días.
- Tiempo de celular, redes, videos cortos, videojuegos y ocio intencional.
- Diario y cierre del día.
- Configuración inicial y fecha real de inicio de la temporada.
- Registro natural de alimentación sin calorías obligatorias.
- Reportes honestos de actividades sin comprobantes obligatorios.
- Apartado Sistema con reglas, privacidad y estado de temporada.

Comienzan en cero y todavía necesitan más reglas de producto:

- Monedas y tienda de recompensas.
- Edición del propósito.
- Progreso detallado de las fases de cada examen.
- Sincronización con Google Calendar.
- Revisión mensual y análisis automático de patrones.

La versión consolidada diferencia un cero real de un dato desconocido. Las
tendencias y barras aparecen como “Aún no calculado” hasta reunir registros
suficientes.

## Migraciones pendientes

Para activar la versión consolidada en Supabase deben ejecutarse, en orden:

1. `supabase/migrations/202608040001_ai_ready_core.sql`
2. `supabase/migrations/202608040002_consolidate_first_season.sql`
3. `supabase/migrations/202608130001_planner_studies_phase_one.sql`

Las tres son aditivas, mantienen RLS y no eliminan tablas ni datos. La tercera
separa materias, cursos y autoestudio, y añade el compromiso flexible de tareas.
No se debe publicar la interfaz antes de aplicar las migraciones correspondientes.

## Estructura

- `app/page.tsx`: composición actual de las vistas del producto.
- `components/`: componentes independientes, comenzando por el acceso.
- `lib/types.ts`: contratos compartidos por interfaz y datos.
- `lib/supabase/client.ts`: cliente público de Supabase.
- `lib/supabase/dashboard.ts`: consultas y transformaciones del núcleo real.
- `supabase/migrations/`: versión controlada del esquema PostgreSQL.
- `next.config.ts`: configuración de la aplicación Next.js.

## Configuración local

Copia `.env.example` como `.env.local` y completa:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Ambos valores son públicos y están protegidos por las políticas RLS. Nunca se
debe añadir al navegador una clave secreta o `service_role`.

## Desarrollo

```text
npm install
npm run dev
```

La compilación de producción usa Next.js estándar y está preparada para
desplegarse en Vercel.

## Criterio de evolución

Cada dato visible debe pertenecer a uno de estos estados:

1. Real: calculado desde Supabase.
2. Desconocido: “Sin datos”, “Por registrar” o “Aún no calculado”.
3. Contable en cero: XP, monedas, sesiones o tareas realmente inexistentes.

El XP de esfuerzo y el dominio de una habilidad son medidas independientes.
La tabla definitiva de XP, niveles, monedas y recompensas sigue pendiente de
aprobación; hasta entonces no se asignan cantidades nuevas automáticamente.
