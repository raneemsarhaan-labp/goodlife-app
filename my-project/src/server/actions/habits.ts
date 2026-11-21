"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { emptyToUndefined, uuidSchema } from "@/lib/validation/common";
import { habitEditSchema, orderSchema } from "@/lib/validation/plan";
import { habitSchema } from "@/lib/validation/today";
import { formObject, firstIssuePath } from "./admin/guard";
import { fail, fromDbError, ok, type Result } from "./result";

type State = Result<null> | null;

function refresh() {
  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/account/archived-habits");
}

/** Adds a habit to the member's current plan (end of the list), optionally in a focus area. */
export async function createHabit(_prev: State, formData: FormData): Promise<State> {
  const parsed = habitSchema.safeParse({ name: formData.get("name"), description: formData.get("description") ?? "" });
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error) || "name");
  const focusAreaId = uuidSchema.optional().safeParse(emptyToUndefined(formData.get("focusAreaId")));
  const supabase = await createClient();
  const { data: planId, error: planError } = await supabase.rpc("current_plan_id");
  if (planError || !planId) return fail("forbidden");
  const { data: last } = await supabase
    .from("habits")
    .select("sort_order")
    .eq("plan_id", planId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("habits").insert({
    plan_id: planId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    focus_area_id: focusAreaId.success ? (focusAreaId.data ?? null) : null,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) return fromDbError(error);
  refresh();
  redirect(formData.get("returnTo") === "plan" ? "/plan" : "/");
}

export async function updateHabit(_prev: State, formData: FormData): Promise<State> {
  const parsed = habitEditSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("habits")
    .update({ name: parsed.data.name, description: parsed.data.description ?? null, focus_area_id: parsed.data.focusAreaId ?? null })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return fromDbError(error);
  if (!data?.length) return fail("not_found");
  refresh();
  return ok(null);
}

export async function reorderHabits(ids: string[]): Promise<Result<null>> {
  const parsed = orderSchema.safeParse(ids);
  if (!parsed.success) return fail("invalid_input");
  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_habits", { p_ids: parsed.data });
  if (error) return fromDbError(error);
  refresh();
  return ok(null);
}

export async function archiveHabit(formData: FormData): Promise<void> {
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("habits").update({ archived_at: new Date().toISOString() }).eq("id", id.data);
  refresh();
  redirect("/plan");
}

export async function restoreHabit(formData: FormData): Promise<void> {
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("habits").update({ archived_at: null }).eq("id", id.data);
  refresh();
}
