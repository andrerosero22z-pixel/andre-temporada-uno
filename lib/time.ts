export const APP_TIME_ZONE = "America/Guayaquil";

export function dateIsoInAppTimeZone(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export function addDaysToIsoDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatAppDate(value: string) {
  return new Intl.DateTimeFormat("es-EC", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function formatPlannerDate(value: string) {
  const parts = new Intl.DateTimeFormat("es-EC", {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
    day: "numeric",
  }).formatToParts(new Date(`${value}T12:00:00Z`));

  return {
    day: parts.find((part) => part.type === "weekday")?.value ?? "",
    date: parts.find((part) => part.type === "day")?.value ?? "",
  };
}

export function greetingForAppTime(value = new Date()) {
  const hourPart = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value).find((part) => part.type === "hour")?.value;
  const hour = Number(hourPart ?? "12");

  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function seasonWeekFromDate(startDate: string | null, today = dateIsoInAppTimeZone()) {
  if (!startDate) return null;
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const current = Date.parse(`${today}T00:00:00Z`);
  const elapsedDays = Math.floor((current - start) / 86_400_000);

  if (elapsedDays < 0) return null;
  return Math.min(8, Math.floor(elapsedDays / 7) + 1);
}
