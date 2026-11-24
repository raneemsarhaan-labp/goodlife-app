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

/**
 * A mobile number in international form (+9665…). Accepts what people type: Arabic-Indic digits,
 * spaces and dashes, a leading 00, and Saudi local numbers (05xxxxxxxx or 5xxxxxxxx).
 */
export function normalizePhone(raw: string): string {
  let v = toAsciiDigits(raw).replace(/[\s\-().]/g, "");
  if (v.startsWith("00")) v = `+${v.slice(2)}`;
  if (/^05\d{8}$/.test(v)) v = `+966${v.slice(1)}`;
  else if (/^5\d{8}$/.test(v)) v = `+966${v}`;
  return v;
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

/** The login a mobile-only account uses behind the scenes. Never receives mail (.invalid is reserved). */
export const loginEmailFor = (phone: string) => `p${phone.replace(/\D/g, "")}@phone.goodlife.invalid`;
