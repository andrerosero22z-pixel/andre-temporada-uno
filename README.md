# Andre: Temporada Uno

Sistema personal gamificado para organizar estudios, hábitos, metas y evidencia
de progreso. La aplicación está pensada primero para Andre y se publica como
una web privada instalable.

## Estado actual

Ya usan datos reales de Supabase:

- Acceso mediante enlace seguro enviado al correo.
- Materias creadas desde el planificador.
- Tareas.
- Exámenes y otras evaluaciones.
- No negociables del día.

Todavía son datos de demostración:

- Niveles, XP y monedas.
- Barras generales y habilidades.
- Metas y mediciones físicas.
- Gráficas históricas.
- Diario y revisiones.

Es importante conservar esta distinción hasta que cada módulo calcule sus
valores desde evidencia real.

## Estructura

- `app/page.tsx`: composición actual de las vistas del producto.
- `components/`: componentes independientes, comenzando por el acceso.
- `lib/types.ts`: contratos compartidos por interfaz y datos.
- `lib/supabase/client.ts`: cliente público de Supabase.
- `lib/supabase/dashboard.ts`: consultas y transformaciones del núcleo real.
- `supabase/migrations/`: versión controlada del esquema PostgreSQL.
- `.openai/hosting.json`: vínculo con el sitio publicado.

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

La compilación de producción usa Vinext y Cloudflare Workers mediante el flujo
de Sites incluido en este repositorio.

## Criterio de evolución

Cada dato visible debe pertenecer a uno de estos estados:

1. Real: calculado desde Supabase.
2. Provisional: mostrado claramente como una estimación.
3. Demostración: diseño pendiente de conexión.

Ninguna barra debe convertirse en “real” hasta tener una fórmula y una fuente
de evidencia comprensibles.
