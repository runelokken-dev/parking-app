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
