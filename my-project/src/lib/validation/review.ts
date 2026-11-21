import { z } from "zod";

// data-model.md monthly_reviews.month ("YYYY-MM" in URLs and forms → first day of month)
export const monthKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
  .transform((v) => `${v}-01`);

// data-model.md monthly_reviews.answers ({question_id: answer}), monthly_reviews.status
export const reviewSubmitSchema = z.object({
  month: monthKeySchema,
  answers: z.record(z.uuid(), z.string().trim().max(2000)),
  complete: z.boolean(),
});
