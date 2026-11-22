import { describe, expect, it } from "vitest";
import { isActivityCardVisible } from "@/lib/activity-card";
import { sessionsFromForm, sessionsSchema, registrationSettingsSchema } from "@/lib/validation/activities";

const today = "2026-11-22";
const card = (over: Partial<{ dismissed_on: string | null; next_local_date: string; cancelled: boolean }> = {}) => ({
  dismissed_on: null,
  next_local_date: "2026-11-26",
  cancelled: false,
  ...over,
});

describe("«نشاط سجّلت فيه» card visibility (research §9)", () => {
  it("shows when never closed", () => expect(isActivityCardVisible(card(), today)).toBe(true));
  it("hides for the rest of the day it was closed", () => expect(isActivityCardVisible(card({ dismissed_on: today }), today)).toBe(false));
  it("stays hidden on days without a session", () => expect(isActivityCardVisible(card({ dismissed_on: "2026-11-21" }), today)).toBe(false));
  it("comes back on the next session's day", () =>
    expect(isActivityCardVisible(card({ dismissed_on: "2026-11-21", next_local_date: today }), today)).toBe(true));
  it("closed on the session day: hidden until the following session", () =>
    expect(isActivityCardVisible(card({ dismissed_on: today, next_local_date: today }), today)).toBe(false));
  it("a cancellation is shown even if the card was closed before", () =>
    expect(isActivityCardVisible(card({ dismissed_on: "2026-11-20", cancelled: true }), today)).toBe(true));
});

describe("activity sessions and registration settings (data-model.md activity_sessions, activities)", () => {
  it("pairs repeated form fields and skips empty rows", () => {
    expect(sessionsFromForm(["2026-12-01T18:00", "", "2026-12-08T18:00"], ["2026-12-01T19:00", "", ""])).toEqual([
      { startsAt: "2026-12-01T18:00", endsAt: "2026-12-01T19:00" },
      { startsAt: "2026-12-08T18:00", endsAt: "" },
    ]);
  });
  it("needs 1–52 sessions, ends after starts, no duplicates", () => {
    expect(sessionsSchema.safeParse([]).success).toBe(false);
    expect(sessionsSchema.safeParse([{ startsAt: "2026-12-01T18:00", endsAt: "2026-12-01T17:00" }]).success).toBe(false);
    expect(sessionsSchema.safeParse([{ startsAt: "2026-12-01T18:00" }, { startsAt: "2026-12-01T18:00" }]).success).toBe(false);
    expect(sessionsSchema.safeParse(Array.from({ length: 53 }, (_, i) => ({ startsAt: `2026-12-01T${String(i % 24).padStart(2, "0")}:${String(i).padStart(2, "0")}` }))).success).toBe(false);
    expect(sessionsSchema.safeParse([{ startsAt: "2026-12-01T18:00", endsAt: "" }]).success).toBe(true);
  });
  it("capacity 1–1,000 or empty; meeting link must be https", () => {
    expect(registrationSettingsSchema.parse({ registrationOpen: "on", capacity: "", mode: "online" })).toMatchObject({ registrationOpen: true, capacity: undefined });
    expect(registrationSettingsSchema.safeParse({ capacity: "0" }).success).toBe(false);
    expect(registrationSettingsSchema.safeParse({ capacity: "1001" }).success).toBe(false);
    expect(registrationSettingsSchema.safeParse({ meetingUrl: "http://meet.example.test" }).success).toBe(false);
    expect(registrationSettingsSchema.safeParse({ meetingUrl: "https://meet.example.test/x" }).success).toBe(true);
  });
});
