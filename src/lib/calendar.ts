/**
 * Calendar arithmetic on whole-day numbers (days since 1 Jan 1970, UTC), so
 * ranges and labels never drift with the viewer's time zone.
 */

const DAY_MS = 864e5;

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Day number of a calendar date; out-of-range parts roll over (day 0 is the previous month's last). */
export function dayOf(year: number, month: number, date: number): number {
  return Date.UTC(year, month, date) / DAY_MS;
}

/** "2026-10-15" → day number */
export function parseDay(iso: string): number {
  return dayOf(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
}

/** Day number → "2026-10-15" */
export function isoDay(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** Day number → [year, month (0–11), date] */
export function ymd(day: number): [number, number, number] {
  const d = new Date(day * DAY_MS);
  return [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()];
}

export function daysInMonth(day: number): number {
  const [y, m] = ymd(day);
  return dayOf(y, m + 1, 1) - dayOf(y, m, 1);
}

/** 0 for Monday through 6 for Sunday. */
export function weekdayIndex(day: number): number {
  return (new Date(day * DAY_MS).getUTCDay() + 6) % 7;
}

/** Day number → "15 Oct" */
export function dayLabel(day: number): string {
  const [, m, d] = ymd(day);
  return `${d} ${MONTHS[m]}`;
}
