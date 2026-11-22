import { z } from "zod";
import { HABIT_ICON_NAMES } from "@/ui/icons.generated";
import { registrationSettingsSchema, sessionsSchema } from "./activities";
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

// data-model.md activities.title, activities.description, activities.location,
// activity_audiences.cohort_id, activity_audiences.group_id; sessions and registration settings
// from src/lib/validation/activities.ts (spec 003).
export const activitySchema = z
  .object({
    id: z.preprocess(emptyToUndefined, uuidSchema.optional()),
    title: z.string().trim().min(2).max(120),
    description: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
    sessions: sessionsSchema,
    location: z.preprocess(emptyToUndefined, z.string().trim().max(300).optional()),
    audience: z.enum(["groups", "cohort"]),
    groupIds: z.array(uuidSchema).default([]),
    cohortId: z.preprocess(emptyToUndefined, uuidSchema.optional()),
    ...registrationSettingsSchema.shape,
  })
  .refine((a) => (a.audience === "groups" ? a.groupIds.length > 0 : Boolean(a.cohortId)), { path: ["audience"] });

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

// data-model.md review_questions.text, review_questions.sort_order, review_questions.active
export const reviewQuestionSchema = z.object({
  id: z.preprocess(emptyToUndefined, uuidSchema.optional()),
  text: z.string().trim().min(2).max(300),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  active: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

// data-model.md encouragement_phrases.text, encouragement_phrases.sort_order, encouragement_phrases.active
export const encouragementPhraseSchema = z.object({
  id: z.preprocess(emptyToUndefined, uuidSchema.optional()),
  text: z.string().trim().min(2).max(80),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  active: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

// data-model.md quotes.text, quotes.source, quotes.sort_order, quotes.active (spec 002 FR-031)
export const quoteSchema = z.object({
  id: z.preprocess(emptyToUndefined, uuidSchema.optional()),
  text: z.string().trim().min(10).max(400),
  source: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

// data-model.md (spec 004) life_domains.name, life_domains.icon, life_domains.color, life_domains.sort_order
export const lifeDomainSchema = z.object({
  id: uuidSchema,
  name: z.string().trim().min(2).max(40),
  icon: z.enum(HABIT_ICON_NAMES),
  color: z.enum(["sage", "dawn", "gold", "ink", "violet"]),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  active: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

// data-model.md (spec 004) habit_library.name, habit_library.amount, habit_library.hint, habit_library.icon
export const libraryHabitSchema = z.object({
  id: z.preprocess(emptyToUndefined, uuidSchema.optional()),
  domainId: uuidSchema,
  name: z.string().trim().min(1).max(80),
  amount: z.preprocess(emptyToUndefined, z.string().trim().max(60).optional()),
  hint: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  icon: z.preprocess(emptyToUndefined, z.enum(HABIT_ICON_NAMES).optional()),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  active: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

// data-model.md (spec 005) challenge_library.title, challenge_library.prompt, challenge_library.habit_name, challenge_library.style
export const libraryChallengeSchema = z.object({
  id: z.preprocess(emptyToUndefined, uuidSchema.optional()),
  domainId: uuidSchema,
  style: z.enum(["action", "reflection"]),
  title: z.string().trim().min(2).max(200),
  prompt: z.preprocess(emptyToUndefined, z.string().trim().max(300).optional()),
  habitName: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  active: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});
