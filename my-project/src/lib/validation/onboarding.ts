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
