import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";

type TaskType = "Tarea" | "Examen" | "Práctica";
type TaskState = "today" | "upcoming" | "done";

const validTypes = new Set<TaskType>(["Tarea", "Examen", "Práctica"]);
const validStates = new Set<TaskState>(["today", "upcoming", "done"]);

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operación.";
}

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select().from(tasks).orderBy(asc(tasks.dueDate), asc(tasks.createdAt));
    return Response.json({ tasks: rows });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      title?: string;
      subject?: string;
      dueDate?: string;
      type?: TaskType;
    };
    const title = payload.title?.trim() ?? "";
    const subject = payload.subject?.trim() || "General";
    const type = payload.type && validTypes.has(payload.type) ? payload.type : "Tarea";
    const dueDate = payload.dueDate || null;
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Guayaquil",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const state: TaskState = !dueDate || dueDate <= today ? "today" : "upcoming";

    if (!title) {
      return Response.json({ error: "Escribe el nombre de la tarea." }, { status: 400 });
    }

    const db = await getDb();
    const [task] = await db
      .insert(tasks)
      .values({
        id: crypto.randomUUID(),
        title,
        subject,
        dueDate,
        type,
        state,
      })
      .returning();

    return Response.json({ task }, { status: 201 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as { id?: string; state?: TaskState };
    if (!payload.id || !payload.state || !validStates.has(payload.state)) {
      return Response.json({ error: "Cambio de tarea inválido." }, { status: 400 });
    }

    const db = await getDb();
    const [task] = await db
      .update(tasks)
      .set({
        state: payload.state,
        completedAt: payload.state === "done" ? new Date().toISOString() : null,
      })
      .where(eq(tasks.id, payload.id))
      .returning();

    if (!task) {
      return Response.json({ error: "No se encontró la tarea." }, { status: 404 });
    }

    return Response.json({ task });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
