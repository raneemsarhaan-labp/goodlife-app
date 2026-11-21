import { z } from "zod";

/** Converts Arabic-Indic (٠-٩) and Eastern Arabic-Indic (۰-۹) digits to ASCII. */
export function toAsciiDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** "" → undefined, so optional form fields validate cleanly. */
export const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const uuidSchema = z.uuid();

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
