import { DEFAULT_HABIT_ICON, HABIT_ICONS, type HabitIconName } from "./icons";
import { HABIT_ICONS_THIN, TIME_ICONS_THIN } from "./icons-thin.generated";

/** The habit icon at weight 200, as the designs draw it in the habit circles (lazily loaded views only). */
export const habitIconThin = (name: string | null | undefined): string =>
  HABIT_ICONS_THIN[(HABIT_ICONS as readonly string[]).includes(name ?? "") ? (name as HabitIconName) : DEFAULT_HABIT_ICON];

/** Time-of-day card icons at weight 200 (habit flow): morning, noon, evening, any time. */
export const TIME_ICONS_THIN_BY_TIME = {
  morning: TIME_ICONS_THIN.wb_twilight,
  noon: HABIT_ICONS_THIN.wb_sunny,
  evening: HABIT_ICONS_THIN.bedtime,
  any: HABIT_ICONS_THIN.schedule,
} as const;
