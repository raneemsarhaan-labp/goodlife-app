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
