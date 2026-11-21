import { z } from "zod";
import { emptyToUndefined, isValidTimeZone, toAsciiDigits } from "./common";

// data-model.md users.full_name, users.phone, users.gender, users.city, users.time_zone
export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.preprocess(
    (v) => (typeof v === "string" ? toAsciiDigits(v).replace(/[\s-]/g, "") : v),
    z.preprocess(emptyToUndefined, z.string().regex(/^\+[1-9][0-9]{7,14}$/).optional()),
  ),
  gender: z.preprocess(emptyToUndefined, z.enum(["male", "female"]).optional()),
  city: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()),
  timeZone: z.string().refine(isValidTimeZone),
});

// data-model.md users.active_role
export const roleSchema = z.enum(["member", "facilitator", "admin"]);
