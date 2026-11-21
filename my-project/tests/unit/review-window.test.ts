import { describe, expect, it } from "vitest";
import { isReviewPromptOpen, monthKey, reviewMonthFor } from "@/lib/review-window";

describe("review window (FR-030)", () => {
  it("opens on the third-to-last day of the month", () => {
    expect(isReviewPromptOpen("2026-11-27")).toBe(false);
    expect(isReviewPromptOpen("2026-11-28")).toBe(true); // 30-day month
    expect(isReviewPromptOpen("2026-12-29")).toBe(true); // 31-day month
    expect(isReviewPromptOpen("2026-12-28")).toBe(false);
    expect(isReviewPromptOpen("2027-02-26")).toBe(true); // 28-day month
    expect(isReviewPromptOpen("2028-02-27")).toBe(true); // 29-day month
    expect(isReviewPromptOpen("2028-02-26")).toBe(false);
  });

  it("stays open through day 7 of the next month", () => {
    expect(isReviewPromptOpen("2026-12-01")).toBe(true);
    expect(isReviewPromptOpen("2026-12-07")).toBe(true);
    expect(isReviewPromptOpen("2026-12-08")).toBe(false);
  });

  it("points to the month being reviewed", () => {
    expect(reviewMonthFor("2026-11-29")).toBe("2026-11-01");
    expect(reviewMonthFor("2026-12-03")).toBe("2026-11-01");
    expect(reviewMonthFor("2027-01-05")).toBe("2026-12-01");
  });

  it("formats month keys for URLs", () => {
    expect(monthKey("2026-11-01")).toBe("2026-11");
  });
});
