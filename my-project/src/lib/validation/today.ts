import { z } from "zod";
import { HABIT_ICON_NAMES } from "@/ui/icons.generated";
import { emptyToUndefined, localDateSchema, uuidSchema } from "./common";

// data-model.md habit_completions.local_date, habit_completions.client_mutation_id, habit_completions.recorded_at
export const setHabitDoneSchema = z.object({
  habitId: uuidSchema,
  localDate: localDateSchema,
  done: z.boolean(),
  clientMutationId: uuidSchema,
  recordedAt: z.iso.datetime({ offset: true }).optional(),
});

// data-model.md challenge_completions.kind
export const setChallengeDoneSchema = z.object({
  kind: z.enum(["journey", "own"]),
  localDate: localDateSchema,
  done: z.boolean(),
  clientMutationId: uuidSchema,
  recordedAt: z.iso.datetime({ offset: true }).optional(),
});

// data-model.md day_entries.intention, day_entries.reflection, own_challenges.text
export const intentionSchema = z.string().trim().max(300);
export const reflectionSchema = z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional());
export const ownChallengeSchema = z.string().trim().max(300).refine((v) => v === "" || v.length >= 2);

// data-model.md habits.name, habits.description
export const habitSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
  // data-model.md habits.icon (spec 002): one of the curated names, or none
  icon: z.preprocess(emptyToUndefined, z.enum(HABIT_ICON_NAMES).optional()),
});
