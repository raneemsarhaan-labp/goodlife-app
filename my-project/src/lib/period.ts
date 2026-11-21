import { addDays, type LocalDate } from "./journey";
import { monthStart } from "./review-window";

export type Period = "week" | "month" | "journey";
export const PERIODS: Period[] = ["week", "month", "journey"];

/** [from, to] for a period ending today, never before the cohort start ("journey" = all of it). */
export function periodRange(period: Period, today: LocalDate, cohortStart: LocalDate): { from: LocalDate; to: LocalDate } {
  const from = period === "week" ? addDays(today, -6) : period === "month" ? monthStart(today) : cohortStart;
  return { from: from < cohortStart ? cohortStart : from, to: today };
}
