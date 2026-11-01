// All schedule dates are plain "YYYY-MM-DD" strings. Arithmetic is done in UTC so DST never shifts a day.
export type ISODate = string;

export function todayIn(tz: string, now: Date = new Date()): ISODate {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

const toDate = (d: ISODate) => new Date(`${d}T00:00:00Z`);
const toISO = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(d: ISODate, n: number): ISODate {
  const x = toDate(d);
  x.setUTCDate(x.getUTCDate() + n);
  return toISO(x);
}
/** Whole days from a to b (b - a). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86_400_000);
}
/** 0 = Sunday … 6 = Saturday */
export function dayOfWeek(d: ISODate): number {
  return toDate(d).getUTCDay();
}
/** Monday of the week containing d. */
export function startOfWeek(d: ISODate): ISODate {
  const dow = dayOfWeek(d);
  return addDays(d, dow === 0 ? -6 : 1 - dow);
}
export function dateRange(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}
export function formatDay(d: ISODate, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat("en-IN", { ...opts, timeZone: "UTC" }).format(toDate(d));
}
export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Strict calendar date validation; reject impossible days rather than normalize them. */
export function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
