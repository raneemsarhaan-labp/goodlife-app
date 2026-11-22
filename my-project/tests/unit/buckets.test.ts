import { describe, expect, it } from "vitest";
import { bucketKind, bucketLabel, rateOf } from "@/lib/buckets";

const b = (from: string, to: string) => ({ from, to, done: 1, possible: 2 });

describe("completion buckets (spec 006 FR-002)", () => {
  it("detects days, weeks and months", () => {
    expect(bucketKind([b("2026-11-21", "2026-11-21"), b("2026-11-22", "2026-11-22")])).toBe("day");
    expect(bucketKind([b("2026-11-01", "2026-11-06"), b("2026-11-07", "2026-11-13")])).toBe("week");
    expect(bucketKind([b("2026-10-01", "2026-10-31"), b("2026-11-01", "2026-11-22")])).toBe("month");
  });
  it("labels in Arabic", () => {
    expect(bucketLabel(b("2026-11-22", "2026-11-22"), "day", (d) => d)).toMatch(/أحد/);
    expect(bucketLabel(b("2026-11-07", "2026-11-13"), "week", (d) => `أسبوع ${d}`)).toBe("أسبوع ٧ نوفمبر");
    expect(bucketLabel(b("2026-10-01", "2026-10-31"), "month", (d) => d)).toBe("أكتوبر");
  });
  it("rate is 0 without scheduled days", () => {
    expect(rateOf(0, 0)).toBe(0);
    expect(rateOf(3, 4)).toBe(0.75);
  });
});
