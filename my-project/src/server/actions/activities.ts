"use server";

import { revalidatePath } from "next/cache";
import { zonedLocalToUtc } from "@/lib/time";
import { createClient } from "@/lib/supabase/server";
import { activitySchema } from "@/lib/validation/admin";
import { sessionsFromForm } from "@/lib/validation/activities";
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
  const raw = formObject(formData, ["groupIds", "sessionStarts", "sessionEnds"]);
  const parsed = activitySchema.safeParse({ ...raw, sessions: sessionsFromForm(raw.sessionStarts as unknown[], raw.sessionEnds as unknown[]) });
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const a = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_activity", {
    p_id: a.id ?? undefined,
    p_title: a.title,
    p_description: a.description ?? "",
    p_location: a.location ?? "",
    p_group_ids: a.audience === "groups" ? a.groupIds : undefined,
    p_cohort_id: a.audience === "cohort" ? a.cohortId : undefined,
    p_sessions: a.sessions.map((s) => ({
      starts_at: zonedLocalToUtc(s.startsAt, user.timeZone).toISOString(),
      ends_at: s.endsAt ? zonedLocalToUtc(s.endsAt, user.timeZone).toISOString() : null,
    })),
    p_registration_open: a.registrationOpen,
    p_capacity: a.capacity,
    p_mode: a.mode,
    p_meeting_url: a.mode === "online" ? (a.meetingUrl ?? "") : "",
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

// ── Registration (spec 003 US2) ────────────────────────────────────────────

function refreshActivity(id: string) {
  revalidatePath(`/activities/${id}`);
  revalidatePath("/");
}

/** Registers the caller (FR-012, FR-013). Full → limit_reached; closed → conflict. */
export async function registerForActivity(activityId: string): Promise<Result<null>> {
  const id = uuidSchema.safeParse(activityId);
  if (!id.success) return fail("invalid_input");
  const supabase = await createClient();
  const { error } = await supabase.rpc("register_for_activity", { p_activity: id.data });
  if (error) return fromDbError(error);
  refreshActivity(id.data);
  return ok(null);
}

/** Cancels the caller's registration while the window is open (FR-012). */
export async function cancelRegistration(activityId: string): Promise<Result<null>> {
  const id = uuidSchema.safeParse(activityId);
  if (!id.success) return fail("invalid_input");
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_activity_registration", { p_activity: id.data });
  if (error) return fromDbError(error);
  refreshActivity(id.data);
  return ok(null);
}

/** Hides the activity's «يومك» card for the rest of the day (FR-016). */
export async function dismissActivityCard(activityId: string): Promise<Result<null>> {
  const id = uuidSchema.safeParse(activityId);
  if (!id.success) return fail("invalid_input");
  const supabase = await createClient();
  const { error } = await supabase.rpc("dismiss_activity_card", { p_activity: id.data });
  if (error) return fromDbError(error);
  revalidatePath("/");
  return ok(null);
}
