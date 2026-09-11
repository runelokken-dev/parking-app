// Alle datoer lagres/sammenlignes som UTC-midnatt for å unngå tidssoneglipp.

export function utcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
}

export function todayUtcMidnight(): Date {
  return utcMidnight(new Date());
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const weekdayFormatter = new Intl.DateTimeFormat("nb-NO", {
  weekday: "short",
  timeZone: "UTC",
});
const dayMonthFormatter = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const monthFormatter = new Intl.DateTimeFormat("nb-NO", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatWeekday(date: Date): string {
  const s = weekdayFormatter.format(date);
  return s.charAt(0).toUpperCase() + s.slice(1).replace(".", "");
}

export function formatDayMonth(date: Date): string {
  return dayMonthFormatter.format(date);
}

export function formatMonthLabel(date: Date): string {
  const s = monthFormatter.format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

// --- Utvidelser for tidsrom-basert booking ---

export const MAX_ADVANCE_DAYS = 60; // ca. 2 måneder fram i tid

export function combineDateAndHour(dateKey: string, hour: number): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hour, 0, 0));
}

export function maxBookableDate(): Date {
  return addDays(todayUtcMidnight(), MAX_ADVANCE_DAYS);
}

const dateTimeFormatter = new Intl.DateTimeFormat("nb-NO", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const hourFormatter = new Intl.DateTimeFormat("nb-NO", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatDateTime(date: Date): string {
  const s = dateTimeFormatter.format(date);
  return s.charAt(0).toUpperCase() + s.slice(1).replace(".", "");
}

export function formatHour(date: Date): string {
  return hourFormatter.format(date);
}

export function durationHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}
