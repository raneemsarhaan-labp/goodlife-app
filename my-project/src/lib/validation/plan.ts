import { z } from "zod";
import { HABIT_ICON_NAMES } from "@/ui/icons.generated";
import { emptyToUndefined, uuidSchema } from "./common";

// data-model.md plans.current_state
export const currentStateSchema = z.string().trim().max(5000);

// data-model.md focus_areas.title, focus_areas.description
export const focusAreaSchema = z.object({
  id: z.preprocess(emptyToUndefined, uuidSchema.optional()),
  title: z.string().trim().min(1).max(80),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
});

// data-model.md habits.name, habits.description, habits.focus_area_id
export const habitEditSchema = z.object({
  id: uuidSchema,
  name: z.string().trim().min(1).max(80),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
  focusAreaId: z.preprocess(emptyToUndefined, uuidSchema.optional()),
  // data-model.md habits.icon (spec 002)
  icon: z.preprocess(emptyToUndefined, z.enum(HABIT_ICON_NAMES).optional()),
});

// data-model.md habits.sort_order, focus_areas.sort_order (new order = position in the list)
export const orderSchema = z.array(uuidSchema).min(1).max(200);

// data-model.md (spec 005) plans.identity
export const identitySchema = z.string().trim().max(2000);

// data-model.md (spec 005) focus_areas.description («من أريد أن أكون»), focus_areas.sign, focus_areas.review_on
export const domainAreaSchema = z.object({
  id: uuidSchema,
  description: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
  sign: z.preprocess(emptyToUndefined, z.string().trim().max(300).optional()),
  reviewOn: z.preprocess(emptyToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
});

// data-model.md (spec 005) plans.next_review_on (tomorrow … one year ahead; checked again in SQL)
export const nextReviewSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
