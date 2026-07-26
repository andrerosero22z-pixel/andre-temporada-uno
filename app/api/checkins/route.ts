import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { dailyCheckins } from "@/db/schema";

const validKeys = new Set(["prayer", "hygiene", "movement", "planning", "sleep"]);

function currentDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operación.";
}

export async function GET() {
  try {
    const date = currentDate();
    const rows = await getDb()
      .select()
      .from(dailyCheckins)
      .where(eq(dailyCheckins.date, date));

    return Response.json({
      date,
      checkins: Object.fromEntries(rows.map((row) => [row.habitKey, row.completed])),
    });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as { habitKey?: string; completed?: boolean };
    if (!payload.habitKey || !validKeys.has(payload.habitKey) || typeof payload.completed !== "boolean") {
      return Response.json({ error: "Registro diario inválido." }, { status: 400 });
    }

    const date = currentDate();
    await getDb()
      .insert(dailyCheckins)
      .values({
        date,
        habitKey: payload.habitKey,
        completed: payload.completed,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [dailyCheckins.date, dailyCheckins.habitKey],
        set: {
          completed: payload.completed,
          updatedAt: new Date().toISOString(),
        },
      });

    const [checkin] = await getDb()
      .select()
      .from(dailyCheckins)
      .where(
        and(
          eq(dailyCheckins.date, date),
          eq(dailyCheckins.habitKey, payload.habitKey),
        ),
      );

    return Response.json({ checkin });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
