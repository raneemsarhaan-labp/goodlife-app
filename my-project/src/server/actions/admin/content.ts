"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { closingMessageSchema, journeyChallengeSchema, reviewQuestionSchema } from "@/lib/validation/admin";
import { fail, fromDbError, ok, type Result } from "../result";
import { currentAdmin, firstIssuePath, formObject } from "./guard";

type State = Result<null> | null;

/** Sets (or, with empty text, removes) the journey challenge for one journey day. */
export async function upsertJourneyChallenge(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = journeyChallengeSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const supabase = await createClient();
  const { journeyDay, text } = parsed.data;
  const { error } = text
    ? await supabase.from("journey_challenges").upsert({ journey_day: journeyDay, text }, { onConflict: "journey_day" })
    : await supabase.from("journey_challenges").delete().eq("journey_day", journeyDay);
  if (error) return fromDbError(error);
  revalidatePath("/admin/content");
  return ok(null);
}

export async function upsertClosingMessage(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = closingMessageSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const supabase = await createClient();
  const row = { text: parsed.data.text, active: parsed.data.active };
  const { error } = parsed.data.id
    ? await supabase.from("closing_messages").update(row).eq("id", parsed.data.id)
    : await supabase.from("closing_messages").insert(row);
  if (error) return fromDbError(error);
  revalidatePath("/admin/content");
  return ok(null);
}

export async function upsertReviewQuestion(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = reviewQuestionSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const supabase = await createClient();
  const row = { text: parsed.data.text, sort_order: parsed.data.sortOrder, active: parsed.data.active };
  const { error } = parsed.data.id
    ? await supabase.from("review_questions").update(row).eq("id", parsed.data.id)
    : await supabase.from("review_questions").insert(row);
  if (error) return fromDbError(error);
  revalidatePath("/admin/content");
  return ok(null);
}
