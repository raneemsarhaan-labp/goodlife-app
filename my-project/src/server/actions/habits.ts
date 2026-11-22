"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { emptyToUndefined, uuidSchema } from "@/lib/validation/common";
import { habitEditSchema, orderSchema } from "@/lib/validation/plan";
import { habitShapeSchema } from "@/lib/validation/habits";
import { PRIVATE_PLACEHOLDER } from "@/lib/private-habits";
import { habitSchema } from "@/lib/validation/today";
import { formObject, firstIssuePath } from "./admin/guard";
import { fail, fromDbError, ok, type Result } from "./result";

type State = Result<null> | null;

function refresh() {
  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/account/archived-habits");
}

/**
 * Adds a habit to the member's current plan (end of the list) from the add flow (spec 004 FR-005):
 * name/description, domain, library source, amount, time of day and repeat days. A habit whose domain
 * is one of the plan's domains is placed in that focus area; otherwise an explicit focus area may be
 * given (spec 001 path from «خطتي»).
 */
export async function createHabit(_prev: State, formData: FormData): Promise<State> {
  const parsed = habitSchema.safeParse({ name: formData.get("name"), description: formData.get("description") ?? "", icon: formData.get("icon") ?? "" });
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error) || "name");
  const shape = habitShapeSchema.safeParse({ ...formObject(formData, ["days"]), icon: formData.get("icon") ?? "" });
  if (!shape.success) return fail("invalid_input", firstIssuePath(shape.error) || "days");
  const focusAreaId = uuidSchema.optional().safeParse(emptyToUndefined(formData.get("focusAreaId")));
  const supabase = await createClient();
  const { data: planId, error: planError } = await supabase.rpc("current_plan_id");
  if (planError || !planId) return fail("forbidden");
  const [{ data: last }, { data: domainArea }] = await Promise.all([
    supabase.from("habits").select("sort_order").eq("plan_id", planId).order("sort_order", { ascending: false }).limit(1).maybeSingle(),
    shape.data.domainId
      ? supabase.from("focus_areas").select("id").eq("plan_id", planId).eq("domain_id", shape.data.domainId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  // «عادة خاصّة»: the server never stores the real name (spec 007 FR-006); the client may choose the id
  // so it can keep the name on the device.
  const clientId = uuidSchema.optional().safeParse(emptyToUndefined(formData.get("clientId")));
  const { error } = await supabase.from("habits").insert({
    ...(shape.data.isPrivate && clientId.success && clientId.data ? { id: clientId.data } : {}),
    plan_id: planId,
    name: shape.data.isPrivate ? PRIVATE_PLACEHOLDER : parsed.data.name,
    shared_with_group: shape.data.shared && !shape.data.isPrivate,
    is_private: shape.data.isPrivate,
    description: shape.data.isPrivate ? null : (parsed.data.description ?? null),
    icon: shape.data.icon ?? null,
    domain_id: shape.data.domainId ?? null,
    library_habit_id: shape.data.libraryHabitId ?? null,
    amount: shape.data.amount ?? null,
    time_of_day: shape.data.timeOfDay,
    days: shape.data.days,
    focus_area_id: domainArea?.id ?? (focusAreaId.success ? (focusAreaId.data ?? null) : null),
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) return fromDbError(error);
  refresh();
  redirect(formData.get("returnTo") === "plan" ? "/plan" : "/");
}

/** + in the add flow: makes a life domain one of the plan's (at most three; spec 004 FR-002). */
export async function addPlanDomain(domainId: string): Promise<Result<{ focusAreaId: string }>> {
  const id = uuidSchema.safeParse(domainId);
  if (!id.success) return fail("invalid_input");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_plan_domain", { p_domain: id.data });
  if (error) return fromDbError(error);
  refresh();
  return ok({ focusAreaId: data as string });
}

/** − in the add flow: removes the domain from the plan; its habits keep their domain. */
export async function removePlanDomain(domainId: string): Promise<Result<null>> {
  const id = uuidSchema.safeParse(domainId);
  if (!id.success) return fail("invalid_input");
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_plan_domain", { p_domain: id.data });
  if (error) return fromDbError(error);
  refresh();
  return ok(null);
}

export async function updateHabit(_prev: State, formData: FormData): Promise<State> {
  const parsed = habitEditSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  // Spec 004 US4: domain, amount, time of day, repeat days.
  const shape = habitShapeSchema.safeParse({ ...formObject(formData, ["days"]), icon: formData.get("icon") ?? "" });
  if (!shape.success) return fail("invalid_input", firstIssuePath(shape.error) || "days");
  const supabase = await createClient();
  // A domain that differs from the chosen area's domain moves the habit to that domain's area in the
  // plan, or out of any area (spec 004 US4-AS2).
  let focusAreaId = parsed.data.focusAreaId ?? null;
  const domainId = shape.data.domainId ?? null;
  if (domainId) {
    const { data: area } = focusAreaId ? await supabase.from("focus_areas").select("domain_id, plan_id").eq("id", focusAreaId).maybeSingle() : { data: null };
    if (area?.domain_id && area.domain_id !== domainId) focusAreaId = null;
    if (!focusAreaId) {
      const { data: planId } = await supabase.rpc("current_plan_id");
      const { data: domainArea } = await supabase.from("focus_areas").select("id").eq("plan_id", planId ?? "").eq("domain_id", domainId).maybeSingle();
      focusAreaId = domainArea?.id ?? null;
    }
  }
  const { data, error } = await supabase
    .from("habits")
    .update({
      // A private habit keeps the placeholder on the server (spec 007 FR-006).
      name: shape.data.isPrivate ? PRIVATE_PLACEHOLDER : parsed.data.name,
      shared_with_group: shape.data.shared && !shape.data.isPrivate,
      is_private: shape.data.isPrivate,
      description: shape.data.isPrivate ? null : (parsed.data.description ?? null),
      focus_area_id: focusAreaId,
      domain_id: domainId,
      amount: shape.data.amount ?? null,
      time_of_day: shape.data.timeOfDay,
      days: shape.data.days,
      ...(parsed.data.icon ? { icon: parsed.data.icon } : {}),
    })
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
