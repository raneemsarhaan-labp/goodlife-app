import { describe, expect, it } from "vitest";
import { formatDate, formatFraction, formatHijri, formatNumber } from "@/lib/format";

describe("formatNumber", () => {
  it("uses Arabic-Indic digits by default", () => {
    expect(formatNumber(12)).toBe("١٢");
  });
  it("can use Latin digits", () => {
    expect(formatNumber(12, "latn")).toBe("12");
  });
  it("formats percentages", () => {
    expect(formatNumber(0.67, "arab", { style: "percent" })).toBe("٦٧٪؜");
  });
});

describe("formatFraction", () => {
  it("formats progress like ٢/٦", () => {
    expect(formatFraction(2, 6)).toBe("٢/٦");
  });
});

describe("formatDate", () => {
  it("formats a local date in Arabic with weekday and month name", () => {
    expect(formatDate("2026-11-21")).toBe("السبت، ٢١ نوفمبر");
  });
  it("can include the year", () => {
    expect(formatDate("2026-11-21", { withYear: true })).toBe("السبت، ٢١ نوفمبر ٢٠٢٦");
  });
});

describe("formatHijri", () => {
  it("formats the Umm al-Qura Hijri date", () => {
    expect(formatHijri("2026-11-21")).toBe("١١ جمادى الآخرة ١٤٤٨ هـ");
  });
});
