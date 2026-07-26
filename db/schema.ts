import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull().default("General"),
  dueDate: text("due_date"),
  type: text("type", { enum: ["Tarea", "Examen", "Práctica"] })
    .notNull()
    .default("Tarea"),
  state: text("state", { enum: ["today", "upcoming", "done"] })
    .notNull()
    .default("upcoming"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
});

export const dailyCheckins = sqliteTable(
  "daily_checkins",
  {
    date: text("date").notNull(),
    habitKey: text("habit_key").notNull(),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.date, table.habitKey] })],
);
