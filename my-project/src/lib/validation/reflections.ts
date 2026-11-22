import { z } from "zod";
import { localDateSchema, uuidSchema } from "./common";

// data-model.md plans.desired_state
export const desiredStateSchema = z.string().trim().max(2000);

// data-model.md reflections.text, reflections.local_date, reflections.client_mutation_id
export const REFLECTION_MAX = 500;
export const reflectionSchema = z.object({
  text: z.string().trim().min(1).max(REFLECTION_MAX),
  localDate: localDateSchema.optional(),
  clientMutationId: uuidSchema,
});
