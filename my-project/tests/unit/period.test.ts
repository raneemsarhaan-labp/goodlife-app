import { describe, expect, it } from "vitest";
import { periodRange } from "@/lib/period";

describe("periodRange", () => {
  it("week = the last 7 days including today", () => {
    expect(periodRange("week", "2026-11-21", "2026-01-01")).toEqual({ from: "2026-11-15", to: "2026-11-21" });
  });
  it("month = from the first of this month", () => {
    expect(periodRange("month", "2026-11-21", "2026-01-01")).toEqual({ from: "2026-11-01", to: "2026-11-21" });
  });
  it("journey = from the cohort start", () => {
    expect(periodRange("journey", "2026-11-21", "2026-11-10")).toEqual({ from: "2026-11-10", to: "2026-11-21" });
  });
  it("never starts before the cohort (late in a new journey)", () => {
    expect(periodRange("week", "2026-11-12", "2026-11-10")).toEqual({ from: "2026-11-10", to: "2026-11-12" });
    expect(periodRange("month", "2026-11-12", "2026-11-10")).toEqual({ from: "2026-11-10", to: "2026-11-12" });
  });
});
