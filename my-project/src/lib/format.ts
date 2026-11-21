/**
 * The single place that decides how dates and numbers look (constitution I).
 * Default digits: Arabic-Indic (٢/٦), switchable to Latin with DIGITS.
 */
import type { LocalDate } from "./journey";

export type Digits = "arab" | "latn";
export const DIGITS: Digits = "arab";

function asUtcNoon(date: LocalDate): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function formatNumber(
  value: number,
  digits: Digits = DIGITS,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(`ar-u-nu-${digits}`, options).format(value);
}

/** Progress like ٢/٦ (done/total). */
export function formatFraction(done: number, total: number, digits: Digits = DIGITS): string {
  return `${formatNumber(done, digits)}/${formatNumber(total, digits)}`;
}

/** e.g. «السبت، ٢١ نوفمبر» (Gregorian, Arabic month names). */
export function formatDate(
  date: LocalDate,
  { withYear = false, withWeekday = true, digits = DIGITS }: { withYear?: boolean; withWeekday?: boolean; digits?: Digits } = {},
): string {
  return new Intl.DateTimeFormat(`ar-u-nu-${digits}`, {
    timeZone: "UTC",
    weekday: withWeekday ? "long" : undefined,
    day: "numeric",
    month: "long",
    year: withYear ? "numeric" : undefined,
  }).format(asUtcNoon(date));
}

/** Umm al-Qura Hijri date, e.g. «١١ جمادى الآخرة ١٤٤٨ هـ». */
export function formatHijri(date: LocalDate, digits: Digits = DIGITS): string {
  return new Intl.DateTimeFormat(`ar-u-ca-islamic-umalqura-nu-${digits}`, {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(asUtcNoon(date));
}

/** Time of day for an instant in a time zone, e.g. «٧:٣٠ م». */
export function formatTime(at: Date | string, timeZone: string, digits: Digits = DIGITS): string {
  return new Intl.DateTimeFormat(`ar-u-nu-${digits}`, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(typeof at === "string" ? new Date(at) : at);
}

/** Date and time of an instant in a time zone, e.g. «الثلاثاء، ٢٤ نوفمبر، ٧:٣٠ م». */
export function formatDateTime(at: Date | string, timeZone: string, digits: Digits = DIGITS): string {
  return new Intl.DateTimeFormat(`ar-u-nu-${digits}`, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(typeof at === "string" ? new Date(at) : at);
}
