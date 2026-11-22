import { describe, expect, it } from "vitest";
import { ALL_DAYS, dayCount, fromMask, isOn, toMask, weekdayOf } from "@/lib/days";
import { habitShapeSchema } from "@/lib/validation/habits";

describe("repeat-days mask (spec 004 research §2)", () => {
  it("bit d is weekday d, Sunday = 0", () => {
    expect(toMask([0])).toBe(1);
    expect(toMask([6])).toBe(64);
    expect(toMask([0, 1, 2, 3, 4])).toBe(31);
    expect(toMask([0, 1, 2, 3, 4, 5, 6])).toBe(ALL_DAYS);
  });
  it("lists days Saturday first", () => {
    expect(fromMask(ALL_DAYS)).toEqual([6, 0, 1, 2, 3, 4, 5]);
    expect(fromMask(31)).toEqual([0, 1, 2, 3, 4]);
  });
  it("counts and tests days; ignores duplicates and out-of-range", () => {
    expect(dayCount(toMask([1, 1, 3, 9]))).toBe(2);
    expect(isOn(31, 5)).toBe(false);
    expect(isOn(31, 0)).toBe(true);
  });
  it("weekday of a local date", () => {
    expect(weekdayOf("2026-11-22")).toBe(0); // Sunday
    expect(weekdayOf("2026-11-28")).toBe(6); // Saturday
  });
});

describe("habit shape (data-model.md habits.amount, habits.time_of_day, habits.days)", () => {
  it("defaults to any time and needs at least one day", () => {
    expect(habitShapeSchema.parse({ days: ["0", "1"] })).toMatchObject({ timeOfDay: "any", days: 3 });
    expect(habitShapeSchema.safeParse({ days: [] }).success).toBe(false);
  });
  it("limits amount to 60 characters", () => {
    expect(habitShapeSchema.safeParse({ days: [1], amount: "ص".repeat(60) }).success).toBe(true);
    expect(habitShapeSchema.safeParse({ days: [1], amount: "ص".repeat(61) }).success).toBe(false);
  });
  it("rejects an unknown time of day", () => {
    expect(habitShapeSchema.safeParse({ days: [1], timeOfDay: "night" }).success).toBe(false);
  });
});
