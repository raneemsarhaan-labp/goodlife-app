import { describe, expect, it } from "vitest";
import {
  addDays,
  greetingKey,
  journeyDay,
  journeyStatus,
  localDate,
  localHour,
} from "@/lib/journey";

describe("localDate", () => {
  it("uses the user's time zone, not UTC", () => {
    const at = new Date(Date.UTC(2026, 10, 21, 22, 30)); // 22:30 UTC
    expect(localDate("UTC", at)).toBe("2026-11-21");
    expect(localDate("Asia/Riyadh", at)).toBe("2026-11-22"); // 01:30 next day
    expect(localDate("America/New_York", at)).toBe("2026-11-21");
  });

  it("returns the local hour in the user's time zone", () => {
    const at = new Date(Date.UTC(2026, 10, 21, 9, 0));
    expect(localHour("Asia/Riyadh", at)).toBe(12);
  });
});

describe("addDays", () => {
  it("adds and subtracts calendar days across month and year ends", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("journeyDay", () => {
  it("is 1 on the cohort start date", () => {
    expect(journeyDay("2026-11-10", "2026-11-10")).toBe(1);
  });

  it("counts from the cohort start, so a late joiner sees the cohort's day", () => {
    expect(journeyDay("2026-11-10", "2026-11-21")).toBe(12);
    expect(journeyDay("2026-10-01", "2026-10-30")).toBe(30);
  });

  it("reaches 365 on the last day", () => {
    expect(journeyDay("2026-01-01", addDays("2026-01-01", 364))).toBe(365);
  });
});

describe("journeyStatus", () => {
  it("is not_started before the start date", () => {
    expect(journeyStatus("2026-11-10", "2026-11-09")).toBe("not_started");
  });
  it("is active from day 1 through day 365", () => {
    expect(journeyStatus("2026-11-10", "2026-11-10")).toBe("active");
    expect(journeyStatus("2026-01-01", addDays("2026-01-01", 364))).toBe("active");
  });
  it("is ended after day 365", () => {
    expect(journeyStatus("2026-01-01", addDays("2026-01-01", 365))).toBe("ended");
  });
});

describe("greetingKey", () => {
  it("is morning before 12:00", () => {
    expect(greetingKey(0)).toBe("morning");
    expect(greetingKey(11)).toBe("morning");
  });
  it("is afternoon from 12:00 until 17:00", () => {
    expect(greetingKey(12)).toBe("afternoon");
    expect(greetingKey(16)).toBe("afternoon");
  });
  it("is evening from 17:00", () => {
    expect(greetingKey(17)).toBe("evening");
    expect(greetingKey(23)).toBe("evening");
  });
});
