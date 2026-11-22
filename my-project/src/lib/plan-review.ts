/**
 * Plan review rhythm (spec 005 FR-008, research §5): due on the member's chosen date, or 30 days after
 * the plan was created when no date was chosen. Dates are local YYYY-MM-DD strings.
 */
export function planReviewDue(nextReviewOn: string | null | undefined, planCreatedOn: string, today: string): boolean {
  if (nextReviewOn) return nextReviewOn <= today;
  return addDays(planCreatedOn, 30) <= today;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** «بعد شهر»: the same day next month (clamped to the month's last day). */
export function inOneMonth(date: string): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(d, last), 12)).toISOString().slice(0, 10);
}
