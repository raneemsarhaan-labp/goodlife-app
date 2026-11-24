import { HABIT_ICON_NAMES, ICONS, NAV_ICONS_THIN } from "./icons.generated";

/** Material Symbols Rounded, as data URLs for <IonIcon icon={…}> or <img>. */
export type IconName = keyof typeof ICONS;
export const icon = (name: IconName): string => ICONS[name];

/**
 * The curated habit icons (data-model.md `habits.icon`); must match the check constraint in
 * supabase/migrations/0015_ui_versions.sql.
 */
export type HabitIconName = (typeof HABIT_ICON_NAMES)[number];
export const HABIT_ICONS: readonly HabitIconName[] = HABIT_ICON_NAMES;
export const DEFAULT_HABIT_ICON: HabitIconName = "eco";
export const habitIcon = (name: string | null | undefined): string =>
  ICONS[(HABIT_ICONS as readonly string[]).includes(name ?? "") ? (name as HabitIconName) : DEFAULT_HABIT_ICON];

export type NavIconName = keyof typeof NAV_ICONS_THIN;
export const navIcon = (name: NavIconName): string => NAV_ICONS_THIN[name];
