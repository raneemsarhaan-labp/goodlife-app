import { z } from "zod";
import { emptyToUndefined, isValidTimeZone, toAsciiDigits } from "./common";

// data-model.md invitation_codes.code: 8 chars, alphabet without 0/O/1/I/L.
export const INVITATION_CODE = /^[A-HJKMNP-Z2-9]{8}$/;
export const normalizeCode = (raw: string) => toAsciiDigits(raw).toUpperCase().replace(/[^A-Z0-9]/g, "");
export const invitationCodeSchema = z.string().transform(normalizeCode).pipe(z.string().regex(INVITATION_CODE));

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

// data-model.md users.full_name, users.email, users.phone, users.gender, users.city, users.time_zone
export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: emailSchema,
  phone: z.preprocess(
    (v) => (typeof v === "string" ? toAsciiDigits(v).replace(/[\s-]/g, "") : v),
    z.preprocess(emptyToUndefined, z.string().regex(/^\+[1-9][0-9]{7,14}$/).optional()),
  ),
  gender: z.preprocess(emptyToUndefined, z.enum(["male", "female"]).optional()),
  city: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()),
  timeZone: z.string().refine(isValidTimeZone).default("Asia/Riyadh"),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const otpSchema = z
  .string()
  .transform((v) => toAsciiDigits(v).replace(/\s/g, ""))
  .pipe(z.string().regex(/^\d{6}$/));

/** Country codes recognised when a number is typed without "+" (Arab countries first). Keep in sync with scripts/migrate.mjs. */
const COUNTRY_CODES = ["966", "20", "971", "965", "974", "973", "968", "962", "961", "963", "964", "970", "967", "249", "218", "212", "213", "216", "222", "90", "44", "1"];

/**
 * A mobile number in international form (+9665…, +201…). Accepts what people type: Arabic-Indic
 * digits, spaces and dashes, "00" or "+" before the country code, the country code with a stray
 * leading 0 (0201…), the country code without "+" (2010…, 9665…), and local numbers for Saudi
 * Arabia (05xxxxxxxx, 5xxxxxxxx) and Egypt (01xxxxxxxxx).
 */
export function normalizePhone(raw: string): string {
  let v = toAsciiDigits(raw).replace(/[\s\-().\u200e\u200f]/g, "");
  if (v.startsWith("+")) return v;
  if (v.startsWith("00")) return `+${v.slice(2)}`;
  if (/^05\d{8}$/.test(v)) return `+966${v.slice(1)}`;
  if (/^5\d{8}$/.test(v)) return `+966${v}`;
  if (/^01[0125]\d{8}$/.test(v)) return `+20${v.slice(1)}`;
  if (v.startsWith("0")) v = v.slice(1);
  const withCode = COUNTRY_CODES.some((c) => v.startsWith(c)) && v.length >= 10 && v.length <= 15;
  return withCode ? `+${v}` : v;
}
/**
 * The number from the mobile field: a country picked from the list plus the number typed. A number
 * typed with its own "+"/"00" wins; a typed country code (with or without a leading 0) is not doubled.
 */
export function composePhone(country: string | null | undefined, raw: string): string {
  const v = toAsciiDigits(raw).replace(/[\s\-().\u200e\u200f]/g, "");
  const code = (country ?? "").replace(/\D/g, "");
  if (!code || v.startsWith("+") || v.startsWith("00")) return normalizePhone(v);
  let national = v.replace(/^0+/, "");
  if (national.startsWith(code) && national.length - code.length >= 8) national = national.slice(code.length);
  // Mobile shapes we know: a Saudi number typed with Egypt picked (or the reverse) is caught here.
  if (code === "966" && !/^5\d{8}$/.test(national)) return v;
  if (code === "20" && !/^1\d{9}$/.test(national)) return v;
  return `+${code}${national}`;
}

export const PHONE = /^\+[1-9][0-9]{7,14}$/;
export const phoneSchema = z.string().transform(normalizePhone).pipe(z.string().regex(PHONE));
export const passwordSchema = z.string().min(8).max(72);

// data-model.md users.full_name, users.phone, users.time_zone
export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2).max(80),
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    timeZone: z.string().refine(isValidTimeZone).default("Asia/Riyadh"),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "mismatch" });
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({ phone: phoneSchema, password: z.string().min(1).max(72) });

/**
 * The login a mobile-only account uses behind the scenes; no mail is ever sent to it. The first
 * domain is reserved (.invalid); the others are tried in turn if Supabase refuses an address.
 * Sign-in looks the login up from the account, so any of them works later.
 */
export const loginEmailFor = (phone: string, domain = "phone.goodlife.invalid") => `p${phone.replace(/\D/g, "")}@${domain}`;
