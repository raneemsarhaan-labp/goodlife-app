import { z } from "zod";
import { DESIRED_STATE_MAX, REFLECTION_MAX } from "@/lib/limits";
import { localDateSchema, uuidSchema } from "./common";

export { REFLECTION_MAX };

// data-model.md plans.desired_state
export const desiredStateSchema = z.string().trim().max(DESIRED_STATE_MAX);

// data-model.md reflections.text, reflections.local_date, reflections.client_mutation_id
export const reflectionSchema = z.object({
  text: z.string().trim().min(1).max(REFLECTION_MAX),
  localDate: localDateSchema.optional(),
  clientMutationId: uuidSchema,
});
