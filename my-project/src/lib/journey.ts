/**
 * Journey date math. All per-day records use a local date ("YYYY-MM-DD") in the user's own
 * time zone (research.md §5). Dates are handled as plain strings to avoid time-zone drift.
 */

export type LocalDate = string; // YYYY-MM-DD
export type GreetingKey = "morning" | "afternoon" | "evening";
export type JourneyStatus = "not_started" | "active" | "ended";

export const JOURNEY_LENGTH_DAYS = 365;
const MS_PER_DAY = 86_400_000;

/** The calendar date at `at` in the given IANA time zone. */
export function localDate(timeZone: string, at: Date = new Date()): LocalDate {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** The hour (0–23) at `at` in the given IANA time zone. */
export function localHour(timeZone: string, at: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(at);
  return Number(hour);
}

function toUtcMs(date: LocalDate): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

/** Calendar date `days` after (or before, if negative) `date`. */
export function addDays(date: LocalDate, days: number): LocalDate {
  return new Date(toUtcMs(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

/** Journey day on `date` for a cohort starting on `startDate` (day 1 = start date). */
export function journeyDay(startDate: LocalDate, date: LocalDate): number {
  return daysBetween(startDate, date) + 1;
}

export function journeyStatus(startDate: LocalDate, date: LocalDate): JourneyStatus {
  const day = journeyDay(startDate, date);
  if (day < 1) return "not_started";
  if (day > JOURNEY_LENGTH_DAYS) return "ended";
  return "active";
}

/** Greeting by local hour: morning until 12:00, afternoon until 17:00, evening after (spec). */
export function greetingKey(hour: number): GreetingKey {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
