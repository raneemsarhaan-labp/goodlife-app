import { z } from "zod";
import { MAX_SESSIONS } from "@/lib/limits";
import { emptyToUndefined, uuidSchema } from "./common";

export { MAX_SESSIONS };

const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);

// data-model.md activity_sessions.starts_at, activity_sessions.ends_at (1–52 per activity, ends after start)
export const sessionsSchema = z
  .array(z.object({ startsAt: localDateTime, endsAt: z.preprocess(emptyToUndefined, localDateTime.optional()) }))
  .min(1)
  .max(MAX_SESSIONS)
  .refine((list) => list.every((s) => !s.endsAt || s.endsAt > s.startsAt), { message: "endsAt" })
  .refine((list) => new Set(list.map((s) => s.startsAt)).size === list.length, { message: "duplicate" });

/** Pairs the repeated `sessionStarts` / `sessionEnds` form fields into sessions, skipping empty rows. */
export function sessionsFromForm(starts: unknown[], ends: unknown[]) {
  return starts
    .map((s, i) => ({ startsAt: String(s ?? ""), endsAt: String(ends[i] ?? "") }))
    .filter((s) => s.startsAt !== "");
}

// data-model.md activities.registration_open, activities.capacity, activities.mode, activity_links.meeting_url
export const registrationSettingsSchema = z.object({
  registrationOpen: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  capacity: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(1000).optional()),
  mode: z.enum(["in_person", "online"]).default("in_person"),
  meetingUrl: z.preprocess(emptyToUndefined, z.string().trim().url().startsWith("https://").max(500).optional()),
  // Spec 007: activities.presenter (≤ 120)
  presenter: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
});

export const activityIdSchema = uuidSchema;
