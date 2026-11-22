import { describe, expect, it } from "vitest";
import { addDays, inOneMonth, planReviewDue } from "@/lib/plan-review";

describe("plan review rhythm (spec 005 FR-008)", () => {
  it("is due on or after the chosen date", () => {
    expect(planReviewDue("2026-11-22", "2026-01-01", "2026-11-22")).toBe(true);
    expect(planReviewDue("2026-11-23", "2026-01-01", "2026-11-22")).toBe(false);
  });
  it("without a date, falls due 30 days after the plan was created", () => {
    expect(planReviewDue(null, "2026-10-23", "2026-11-22")).toBe(true);
    expect(planReviewDue(null, "2026-10-24", "2026-11-22")).toBe(false);
  });
  it("«بعد شهر» is the same day next month, clamped", () => {
    expect(inOneMonth("2026-11-22")).toBe("2026-12-22");
    expect(inOneMonth("2027-01-31")).toBe("2027-02-28");
    expect(inOneMonth("2026-12-15")).toBe("2027-01-15");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});
