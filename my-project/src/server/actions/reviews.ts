"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { reviewSubmitSchema } from "@/lib/validation/review";
import { fail, fromDbError, ok, type Result } from "./result";

type State = Result<{ completed: boolean }> | null;

function parse(formData: FormData) {
  const answers: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("q:")) answers[key.slice(2)] = String(value);
  }
  return reviewSubmitSchema.safeParse({ month: formData.get("month"), answers, complete: formData.get("intent") === "complete" });
}

/** Save a draft or complete the monthly review (FR-031, FR-032). */
export async function submitReview(_prev: State, formData: FormData): Promise<State> {
  const parsed = parse(formData);
  if (!parsed.success) return fail("invalid_input");
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_review", {
    p_month: parsed.data.month,
    p_answers: parsed.data.answers,
    p_complete: parsed.data.complete,
  });
  if (error) return error.message.startsWith("conflict") ? fail("conflict") : fromDbError(error);
  revalidatePath("/reviews", "layout");
  revalidatePath("/");
  return ok({ completed: parsed.data.complete });
}
