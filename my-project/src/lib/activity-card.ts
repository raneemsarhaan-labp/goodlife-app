/**
 * Whether a registered activity's card shows on «يومك» today (spec 003 research §9, FR-016, FR-018):
 * - never closed → shown;
 * - closed today → hidden for the rest of the day;
 * - closed earlier → shown again on the local day of the next session, hidden on other days.
 * A cancelled activity only reaches the app on the day it was cancelled, and is shown then.
 */
export function isActivityCardVisible(
  card: { dismissed_on: string | null; next_local_date: string; cancelled: boolean },
  today: string,
): boolean {
  if (!card.dismissed_on) return true;
  if (card.dismissed_on >= today) return false;
  if (card.cancelled) return true;
  return card.next_local_date === today;
}
