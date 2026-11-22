import { z } from "zod";
import { AMOUNT_MAX, TIMES_OF_DAY, toMask } from "@/lib/days";
import { HABIT_ICON_NAMES } from "@/ui/icons.generated";
import { emptyToUndefined, uuidSchema } from "./common";

// data-model.md habits.amount, habits.time_of_day, habits.days, habits.domain_id, habits.library_habit_id
export const habitShapeSchema = z.object({
  domainId: z.preprocess(emptyToUndefined, uuidSchema.optional()),
  libraryHabitId: z.preprocess(emptyToUndefined, uuidSchema.optional()),
  amount: z.preprocess(emptyToUndefined, z.string().trim().max(AMOUNT_MAX).optional()),
  timeOfDay: z.enum(TIMES_OF_DAY).default("any"),
  days: z
    .array(z.coerce.number().int().min(0).max(6))
    .min(1)
    .transform((list) => toMask(list)),
  icon: z.preprocess(emptyToUndefined, z.enum(HABIT_ICON_NAMES).optional()),
  // Spec 007: habits.shared_with_group, habits.is_private (never both)
  shared: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(false),
  isPrivate: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(false),
});
export type HabitShape = z.infer<typeof habitShapeSchema>;
