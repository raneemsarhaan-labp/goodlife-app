import { DEFAULT_HABIT_ICON, HABIT_ICONS, type HabitIconName } from "./icons";
import { HABIT_ICONS_THIN } from "./icons-thin.generated";

/** The habit icon at weight 200, as the designs draw it in the habit circles (lazily loaded views only). */
export const habitIconThin = (name: string | null | undefined): string =>
  HABIT_ICONS_THIN[(HABIT_ICONS as readonly string[]).includes(name ?? "") ? (name as HabitIconName) : DEFAULT_HABIT_ICON];
