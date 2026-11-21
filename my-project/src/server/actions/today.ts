"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  intentionSchema,
  ownChallengeSchema,
  reflectionSchema,
  setChallengeDoneSchema,
  setHabitDoneSchema,
} from "@/lib/validation/today";
import { fail, fromDbError, ok, type Result } from "./result";

/** Check/uncheck a habit for a day. Idempotent on clientMutationId (offline replay). */
export async function setHabitDone(input: unknown): Promise<Result<{ doneCount: number; total: number }>> {
  const parsed = setHabitDoneSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_input");
  const { habitId, localDate, done, clientMutationId, recordedAt } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_habit_done", {
    p_habit: habitId,
    p_local_date: localDate,
    p_done: done,
    p_client_mutation_id: clientMutationId,
    p_recorded_at: recordedAt,
  });
  if (error) return fromDbError(error);
  const counts = data as { done_count: number; total: number };
  return ok({ doneCount: Number(counts.done_count), total: Number(counts.total) });
}

export async function setChallengeDone(input: unknown): Promise<Result<null>> {
  const parsed = setChallengeDoneSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_input");
  const { kind, localDate, done, clientMutationId, recordedAt } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_challenge_done", {
    p_kind: kind,
    p_local_date: localDate,
    p_done: done,
    p_client_mutation_id: clientMutationId,
    p_recorded_at: recordedAt,
  });
  if (error) return fromDbError(error);
  return ok(null);
}

export async function setOwnChallenge(text: string): Promise<Result<null>> {
  const parsed = ownChallengeSchema.safeParse(text);
  if (!parsed.success) return fail("invalid_input", "text");
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_own_challenge", { p_text: parsed.data });
  if (error) return fromDbError(error);
  revalidatePath("/");
  return ok(null);
}

/** «ابدأ يومي» form action. */
export async function setIntention(_prev: Result<null> | null, formData: FormData): Promise<Result<null> | null> {
  const parsed = intentionSchema.safeParse(formData.get("intention") ?? "");
  if (!parsed.success) return fail("invalid_input", "intention");
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_intention", { p_text: parsed.data });
  if (error) return fromDbError(error);
  redirect("/");
}

/** «ختام اليوم» form action: returns the closing message to show. */
export async function closeDay(
  _prev: Result<{ closingMessage: string | null }> | null,
  formData: FormData,
): Promise<Result<{ closingMessage: string | null }> | null> {
  const parsed = reflectionSchema.safeParse(formData.get("reflection") ?? "");
  if (!parsed.success) return fail("invalid_input", "reflection");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("close_day", { p_reflection: parsed.data ?? "" });
  if (error) return fromDbError(error);
  revalidatePath("/");
  return ok({ closingMessage: (data as { closing_message: string | null }).closing_message });
}
