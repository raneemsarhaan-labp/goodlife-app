import { describe, expect, it } from "vitest";
import { HABIT_NAME_MAX, habitNameFromChallenge, hasHabitNamed, normalizeHabitName } from "@/lib/make-habit";

describe("«اجعلها عادة»: challenge text → habit name", () => {
  it("keeps short challenges as they are (spaces tidied)", () => {
    expect(habitNameFromChallenge("  اقرأ صفحةً واحدةً   وقف عند آية ")).toBe("اقرأ صفحةً واحدةً وقف عند آية");
  });
  it(`shortens long challenges to ${HABIT_NAME_MAX} characters at a word boundary`, () => {
    const long = "اتصل بشخص لم تسأل عنه منذ زمن، واسأله عن حاله وأحواله، واستمع إليه بانتباه دون أن تقاطعه أو تستعجل الحديث";
    const name = habitNameFromChallenge(long);
    expect(name.length).toBeLessThanOrEqual(HABIT_NAME_MAX);
    expect(name.endsWith("…")).toBe(true);
    expect(long.startsWith(name.slice(0, -1).trimEnd())).toBe(true);
    expect(long[name.length - 1]).toMatch(/\s|،/);
  });
  it("cuts mid-word only when a single word is too long", () => {
    expect(habitNameFromChallenge("ا".repeat(120)).length).toBe(HABIT_NAME_MAX);
  });
});

describe("duplicate habit names", () => {
  it("ignores diacritics, tatweel, hamza forms and trailing ellipsis", () => {
    expect(normalizeHabitName("اقرأ صفحةً")).toBe(normalizeHabitName("اقرا صفحه"));
    expect(normalizeHabitName("مـشـي")).toBe("مشي");
    expect(hasHabitNamed(["اشرب كوب ماء أولًا"], "اشرب كوب ماء اولا")).toBe(true);
    expect(hasHabitNamed(["قراءة"], "مشي")).toBe(false);
  });
});
