"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/common";
import { currentStateSchema, domainAreaSchema, focusAreaSchema, identitySchema, nextReviewSchema, orderSchema } from "@/lib/validation/plan";
import { desiredStateSchema } from "@/lib/validation/reflections";
import { formObject, firstIssuePath } from "./admin/guard";
import { fail, fromDbError, ok, type Result } from "./result";

type State = Result<null> | null;

function refresh() {
  revalidatePath("/plan");
  revalidatePath("/");
}

export async function saveCurrentState(_prev: State, formData: FormData): Promise<State> {
  const parsed = currentStateSchema.safeParse(formData.get("currentState") ?? "");
  if (!parsed.success) return fail("invalid_input", "currentState");
  const supabase = await createClient();
  const { data: planId } = await supabase.rpc("current_plan_id");
  if (!planId) return fail("forbidden");
  const { error } = await supabase.from("plans").update({ current_state: parsed.data }).eq("id", planId);
  if (error) return fromDbError(error);
  refresh();
  return ok(null);
}

/** «حالي المنشود» (spec 003 FR-001): the state the member wants to reach this year. */
export async function saveDesiredState(_prev: State, formData: FormData): Promise<State> {
  const parsed = desiredStateSchema.safeParse(formData.get("desiredState") ?? "");
  if (!parsed.success) return fail("invalid_input", "desiredState");
  const supabase = await createClient();
  const { data: planId } = await supabase.rpc("current_plan_id");
  if (!planId) return fail("forbidden");
  const { error } = await supabase.from("plans").update({ desired_state: parsed.data }).eq("id", planId);
  if (error) return fromDbError(error);
  refresh();
  return ok(null);
}

/** Create (no id) or edit a focus area of the current plan. */
export async function saveFocusArea(_prev: State, formData: FormData): Promise<State> {
  const parsed = focusAreaSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const supabase = await createClient();
  const { data: planId } = await supabase.rpc("current_plan_id");
  if (!planId) return fail("forbidden");
  const row = { title: parsed.data.title, description: parsed.data.description ?? null };
  let error;
  if (parsed.data.id) {
    ({ error } = await supabase.from("focus_areas").update(row).eq("id", parsed.data.id));
  } else {
    const { data: last } = await supabase.from("focus_areas").select("sort_order").eq("plan_id", planId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
    ({ error } = await supabase.from("focus_areas").insert({ ...row, plan_id: planId, sort_order: (last?.sort_order ?? 0) + 1 }));
  }
  if (error) return fromDbError(error);
  refresh();
  return ok(null);
}

/** Deletes a focus area; its habits are kept and become unlinked. */
export async function deleteFocusArea(formData: FormData): Promise<void> {
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("focus_areas").delete().eq("id", id.data);
  refresh();
}

export async function reorderFocusAreas(ids: string[]): Promise<Result<null>> {
  const parsed = orderSchema.safeParse(ids);
  if (!parsed.success) return fail("invalid_input");
  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_focus_areas", { p_ids: parsed.data });
  if (error) return fromDbError(error);
  refresh();
  return ok(null);
}

export async function copyHabitsFromPreviousPlan(
  _prev: Result<{ count: number }> | null,
  _formData: FormData,
): Promise<Result<{ count: number }> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("copy_habits_from_previous_plan", {});
  if (error) return fromDbError(error);
  refresh();
  return ok({ count: Number(data ?? 0) });
}

/** «هويّتي» (spec 005 FR-001). */
export async function saveIdentity(_prev: State, formData: FormData): Promise<State> {
  const parsed = identitySchema.safeParse(formData.get("identity") ?? "");
  if (!parsed.success) return fail("invalid_input", "identity");
  const supabase = await createClient();
  const { data: planId } = await supabase.rpc("current_plan_id");
  if (!planId) return fail("forbidden");
  const { error } = await supabase.from("plans").update({ identity: parsed.data }).eq("id", planId);
  if (error) return fromDbError(error);
  refresh();
  revalidatePath("/plan/review");
  return ok(null);
}

/** A plan domain's «من أريد أن أكون», «العلامة» and review date (spec 005 FR-002). */
export async function saveDomainArea(_prev: State, formData: FormData): Promise<State> {
  const parsed = domainAreaSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("focus_areas")
    .update({ description: parsed.data.description ?? null, sign: parsed.data.sign ?? null, review_on: parsed.data.reviewOn ?? null })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return fromDbError(error);
  if (!data?.length) return fail("not_found");
  refresh();
  revalidatePath("/plan/review");
  return ok(null);
}

/** Completes «من أنت وما تريد» with the next review date (spec 005 FR-009). */
export async function completePlanReview(_prev: State, formData: FormData): Promise<State> {
  const parsed = nextReviewSchema.safeParse(formData.get("nextReviewOn"));
  if (!parsed.success) return fail("invalid_input", "nextReviewOn");
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_plan_review", { p_next: parsed.data });
  if (error) return fromDbError(error);
  refresh();
  redirect("/plan");
}
