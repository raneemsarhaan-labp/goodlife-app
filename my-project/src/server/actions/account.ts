"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { log } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema, roleSchema } from "@/lib/validation/account";
import { uuidSchema } from "@/lib/validation/common";
import { getCurrentUser } from "@/server/auth";
import { currentAdmin, firstIssuePath, formObject } from "./admin/guard";
import { fail, fromDbError, ok, type Result } from "./result";

type State = Result<null> | null;

export async function updateProfile(_prev: State, formData: FormData): Promise<State> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthenticated");
  const parsed = profileUpdateSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const p = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ full_name: p.fullName, gender: p.gender ?? null, city: p.city ?? null, time_zone: p.timeZone })
    .eq("id", user.id);
  if (error) return fromDbError(error);
  revalidatePath("/", "layout");
  return ok(null);
}

/** Switch the active role without signing out (FR-004), then open that role's home. */
export async function switchRole(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const role = roleSchema.safeParse(formData.get("role"));
  if (!user || !role.success || !user.roles.includes(role.data)) return;
  const supabase = await createClient();
  await supabase.from("users").update({ active_role: role.data }).eq("id", user.id);
  revalidatePath("/", "layout");
  redirect(role.data === "admin" ? "/admin" : role.data === "facilitator" ? "/groups" : "/");
}

/** All of the caller's data as JSON (FR-071). */
export async function requestDataExport(): Promise<Result<{ json: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("export_my_data");
  if (error) return fromDbError(error);
  return ok({ json: JSON.stringify(data, null, 2) });
}

export async function requestAccountDeletion(_prev: State, _formData: FormData): Promise<State> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_account_deletion");
  if (error) return fromDbError(error);
  revalidatePath("/account");
  return ok(null);
}

/**
 * Admin completes a requested deletion: deleting the auth user cascades to the profile and all
 * personal rows (data-model FKs). Allowed only for accounts that asked to be deleted.
 */
export async function processAccountDeletion(formData: FormData): Promise<void> {
  const admin = await currentAdmin();
  const id = uuidSchema.safeParse(formData.get("userId"));
  if (!admin || !id.success || id.data === admin.id) return;
  const supabase = await createClient();
  const { data: target } = await supabase.from("users").select("deletion_requested_at").eq("id", id.data).maybeSingle();
  if (!target?.deletion_requested_at) return;
  const { error } = await createAdminClient().auth.admin.deleteUser(id.data);
  if (error) log.error("account deletion failed", { code: error.code });
  revalidatePath("/admin");
}
