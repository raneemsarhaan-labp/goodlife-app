/** «اجعلها عادة» helpers (spec 003 US3, research §11). */

export const HABIT_NAME_MAX = 80; // data-model.md (spec 001) habits.name

/** Shortens a challenge to the habit-name limit at a word boundary, adding «…» when cut. */
export function habitNameFromChallenge(text: string, max = HABIT_NAME_MAX): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const atWord = cut.replace(/\s+\S*$/, "");
  return `${(atWord.length >= max / 2 ? atWord : cut).trimEnd()}…`;
}

/** Comparable form of a habit name: no diacritics or tatweel, unified alef/yaa/taa marbuta, single spaces. */
export function normalizeHabitName(name: string): string {
  return name
    .normalize("NFC")
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[…\.]+$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasHabitNamed(existing: string[], name: string): boolean {
  const target = normalizeHabitName(name);
  return existing.some((n) => normalizeHabitName(n) === target);
}
