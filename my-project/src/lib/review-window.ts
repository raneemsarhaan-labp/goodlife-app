import { addDays, type LocalDate } from "./journey";

/** First day of the month containing `date`. */
export function monthStart(date: LocalDate): LocalDate {
  return `${date.slice(0, 7)}-01`;
}

function lastDayOfMonth(date: LocalDate): LocalDate {
  const [y, m] = date.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

/** The prompt shows from the 3rd-to-last day of a month through day 7 of the next (FR-030). */
export function isReviewPromptOpen(date: LocalDate): boolean {
  const day = Number(date.slice(8, 10));
  return day <= 7 || date >= addDays(lastDayOfMonth(date), -2);
}

/** The month a review prompt on `date` refers to (first day). */
export function reviewMonthFor(date: LocalDate): LocalDate {
  return Number(date.slice(8, 10)) <= 7 ? monthStart(addDays(monthStart(date), -1)) : monthStart(date);
}

/** "YYYY-MM" for URLs. */
export function monthKey(month: LocalDate): string {
  return month.slice(0, 7);
}

/** Months from `from` through `to` (inclusive), newest first, as first-day dates. */
export function monthsBetween(from: LocalDate, to: LocalDate): LocalDate[] {
  const out: LocalDate[] = [];
  let m = monthStart(to);
  while (m >= monthStart(from)) {
    out.push(m);
    m = monthStart(addDays(m, -1));
  }
  return out;
}
