import { z } from "zod";
import { emptyToUndefined, localDateSchema, uuidSchema } from "./common";
import { emailSchema } from "./onboarding";

const name = z.string().trim().min(2).max(80);

// data-model.md cohorts.name, cohorts.start_date
export const cohortSchema = z.object({
  id: z.preprocess(emptyToUndefined, uuidSchema.optional()),
  name,
  startDate: localDateSchema,
});

// data-model.md groups.name, groups.cohort_id
export const groupSchema = z.object({
  id: z.preprocess(emptyToUndefined, uuidSchema.optional()),
  cohortId: uuidSchema,
  name,
});

export const personInGroupSchema = z.object({ email: emailSchema, groupId: uuidSchema });
export const userInGroupSchema = z.object({ userId: uuidSchema, groupId: uuidSchema });

// data-model.md invitation_codes.max_uses, invitation_codes.expires_at (expiry given in days)
export const invitationsSchema = z.object({
  groupId: uuidSchema,
  count: z.coerce.number().int().min(1).max(50),
  maxUses: z.coerce.number().int().min(1).max(500),
  expiresInDays: z.coerce.number().int().min(1).max(365),
});

// data-model.md activities.title, activities.description, activities.starts_at, activities.ends_at,
// activities.location, activity_audiences.cohort_id, activity_audiences.group_id
export const activitySchema = z
  .object({
    id: z.preprocess(emptyToUndefined, uuidSchema.optional()),
    title: z.string().trim().min(2).max(120),
    description: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
    startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
    endsAt: z.preprocess(emptyToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/).optional()),
    location: z.preprocess(emptyToUndefined, z.string().trim().max(300).optional()),
    audience: z.enum(["groups", "cohort"]),
    groupIds: z.array(uuidSchema).default([]),
    cohortId: z.preprocess(emptyToUndefined, uuidSchema.optional()),
  })
  .refine((a) => (a.audience === "groups" ? a.groupIds.length > 0 : Boolean(a.cohortId)), { path: ["audience"] })
  .refine((a) => !a.endsAt || a.endsAt > a.startsAt, { path: ["endsAt"] });

// data-model.md journey_challenges.journey_day, journey_challenges.text (empty text removes the day's challenge)
export const journeyChallengeSchema = z.object({
  journeyDay: z.coerce.number().int().min(1).max(365),
  text: z.string().trim().max(500).refine((v) => v === "" || v.length >= 2),
});

// data-model.md closing_messages.text, closing_messages.active
export const closingMessageSchema = z.object({
  id: z.preprocess(emptyToUndefined, uuidSchema.optional()),
  text: z.string().trim().min(2).max(200),
  active: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});
