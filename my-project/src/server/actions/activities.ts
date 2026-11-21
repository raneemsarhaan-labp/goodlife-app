"use server";

import { revalidatePath } from "next/cache";
import { zonedLocalToUtc } from "@/lib/time";
import { createClient } from "@/lib/supabase/server";
import { activitySchema } from "@/lib/validation/admin";
import { uuidSchema } from "@/lib/validation/common";
import { getCurrentUser } from "@/server/auth";
import { formObject, firstIssuePath } from "./admin/guard";
import { fail, fromDbError, ok, type Result } from "./result";

/**
 * Create or edit an activity (contracts/server-actions.md). Admins: any audience.
 * Facilitators: only groups they lead (enforced by RLS in save_activity; FR-044).
 * Date-times are entered as wall-clock time in the editor's own time zone.
 */
export async function saveActivity(_prev: Result<{ id: string }> | null, formData: FormData): Promise<Result<{ id: string }> | null> {
  const user = await getCurrentUser();
  if (!user || !(user.roles.includes("admin") || user.roles.includes("facilitator"))) return fail("forbidden");
  const parsed = activitySchema.safeParse(formObject(formData, ["groupIds"]));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const a = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_activity", {
    p_id: a.id ?? undefined,
    p_title: a.title,
    p_description: a.description ?? "",
    p_starts_at: zonedLocalToUtc(a.startsAt, user.timeZone).toISOString(),
    p_ends_at: a.endsAt ? zonedLocalToUtc(a.endsAt, user.timeZone).toISOString() : undefined,
    p_location: a.location ?? "",
    p_group_ids: a.audience === "groups" ? a.groupIds : undefined,
    p_cohort_id: a.audience === "cohort" ? a.cohortId : undefined,
  });
  if (error) return fromDbError(error);
  revalidatePath("/admin/activities");
  revalidatePath("/groups", "layout");
  revalidatePath("/");
  return ok({ id: data as string });
}

export async function cancelActivity(formData: FormData): Promise<void> {
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.rpc("cancel_activity", { p_id: id.data });
  revalidatePath("/admin/activities");
  revalidatePath("/groups", "layout");
  revalidatePath("/");
}
