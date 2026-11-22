/**
 * Repeat days as a 7-bit mask (spec 004 research §2): bit d = weekday d, 0 Sunday … 6 Saturday,
 * matching PostgreSQL `extract(dow)`. Shared by forms and display; free of Zod.
 */
export const ALL_DAYS = 127;
/** Display order: the week starts on Saturday. */
export const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5] as const;
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const toMask = (days: Iterable<number>): number => [...new Set(days)].reduce((m, d) => (d >= 0 && d <= 6 ? m | (1 << d) : m), 0);
export const fromMask = (mask: number): Weekday[] => WEEK_ORDER.filter((d) => (mask >> d) & 1) as Weekday[];
export const isOn = (mask: number, weekday: number): boolean => ((mask >> weekday) & 1) === 1;
export const dayCount = (mask: number): number => fromMask(mask).length;
/** Weekday (0 Sunday) of a YYYY-MM-DD local date. */
export const weekdayOf = (date: string): Weekday => new Date(`${date}T12:00:00Z`).getUTCDay() as Weekday;

export const TIMES_OF_DAY = ["morning", "noon", "evening", "any"] as const;
export type TimeOfDay = (typeof TIMES_OF_DAY)[number];
export const AMOUNT_MAX = 60; // data-model.md habits.amount
