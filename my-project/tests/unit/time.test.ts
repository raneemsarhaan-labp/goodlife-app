import { describe, expect, it } from "vitest";
import { utcToZonedLocal, zonedLocalToUtc } from "@/lib/time";

describe("zonedLocalToUtc", () => {
  it("converts Riyadh wall-clock time (UTC+3)", () => {
    expect(zonedLocalToUtc("2026-11-24T19:30", "Asia/Riyadh").toISOString()).toBe("2026-11-24T16:30:00.000Z");
  });
  it("handles daylight saving time zones", () => {
    expect(zonedLocalToUtc("2026-07-01T09:00", "Europe/London").toISOString()).toBe("2026-07-01T08:00:00.000Z");
    expect(zonedLocalToUtc("2026-12-01T09:00", "Europe/London").toISOString()).toBe("2026-12-01T09:00:00.000Z");
  });
  it("round-trips with utcToZonedLocal", () => {
    const at = zonedLocalToUtc("2027-03-15T06:05", "America/New_York");
    expect(utcToZonedLocal(at, "America/New_York")).toBe("2027-03-15T06:05");
  });
});
