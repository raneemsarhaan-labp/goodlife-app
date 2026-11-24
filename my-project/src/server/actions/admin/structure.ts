"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cohortSchema, groupSchema, personInGroupSchema, resetPasswordSchema, userInGroupSchema, groupSettingsSchema } from "@/lib/validation/admin";
import { emailSchema, normalizePhone, PHONE } from "@/lib/validation/onboarding";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";
import { uuidSchema } from "@/lib/validation/common";
import { fail, fromDbError, ok, type Result } from "../result";
import { currentAdmin, firstIssuePath, formObject } from "./guard";

type State = Result<null> | null;

export async function upsertCohort(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = cohortSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const supabase = await createClient();
  const row = { name: parsed.data.name, start_date: parsed.data.startDate };
  const { error } = parsed.data.id
    ? await supabase.from("cohorts").update(row).eq("id", parsed.data.id)
    : await supabase.from("cohorts").insert(row);
  if (error) return error.code === "23505" ? fail("conflict", "name") : fromDbError(error);
  revalidatePath("/admin", "layout");
  return ok(null);
}

export async function upsertGroup(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = groupSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const supabase = await createClient();
  const { error } = parsed.data.id
    ? await supabase.from("groups").update({ name: parsed.data.name }).eq("id", parsed.data.id)
    : await supabase.from("groups").insert({ cohort_id: parsed.data.cohortId, name: parsed.data.name });
  if (error) return error.code === "23505" ? fail("conflict", "name") : fromDbError(error);
  revalidatePath("/admin", "layout");
  return ok(null);
}

/** Finds an account by mobile number (any common format) or by email. */
async function userIdByContact(value: string): Promise<string | null> {
  const supabase = await createClient();
  const phone = normalizePhone(value);
  if (PHONE.test(phone)) {
    const { data } = await supabase.from("users").select("id").eq("phone", phone).maybeSingle();
    return data?.id ?? null;
  }
  const email = emailSchema.safeParse(value);
  if (!email.success) return null;
  const { data } = await supabase.from("users").select("id").eq("email", email.data).maybeSingle();
  return data?.id ?? null;
}

/** Assign a facilitator by email (the person must already have an account). */
export async function assignFacilitator(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = personInGroupSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", "person");
  const userId = await userIdByContact(parsed.data.person);
  if (!userId) return fail("not_found", "person");
  const supabase = await createClient();
  const { error } = await supabase.rpc("assign_facilitator", { p_user: userId, p_group: parsed.data.groupId });
  if (error) return fromDbError(error);
  revalidatePath("/admin", "layout");
  return ok(null);
}

/** Add an existing account (not yet in any group) as a member, by email. */
export async function addMember(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = personInGroupSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", "person");
  const userId = await userIdByContact(parsed.data.person);
  if (!userId) return fail("not_found", "person");
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_member", { p_user: userId, p_group: parsed.data.groupId });
  if (error) return error.message.startsWith("conflict") ? fail("conflict", "person") : fromDbError(error);
  revalidatePath("/admin", "layout");
  return ok(null);
}

export async function removeFacilitator(formData: FormData): Promise<void> {
  if (!(await currentAdmin())) return;
  const parsed = userInGroupSchema.safeParse(formObject(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.rpc("remove_facilitator", { p_user: parsed.data.userId, p_group: parsed.data.groupId });
  revalidatePath("/admin", "layout");
}

export async function moveMember(formData: FormData): Promise<void> {
  if (!(await currentAdmin())) return;
  const parsed = userInGroupSchema.safeParse(formObject(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.rpc("move_member", { p_user: parsed.data.userId, p_group: parsed.data.groupId });
  revalidatePath("/admin", "layout");
}

export async function grantAdmin(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const person = String(formData.get("person") ?? "").trim();
  const userId = person ? await userIdByContact(person) : null;
  if (!userId) return fail("not_found", "person");
  const supabase = await createClient();
  const { error } = await supabase.rpc("grant_admin", { p_user: userId });
  if (error) return fromDbError(error);
  revalidatePath("/admin", "layout");
  return ok(null);
}

export async function revokeAdmin(formData: FormData): Promise<void> {
  if (!(await currentAdmin())) return;
  const userId = uuidSchema.safeParse(formData.get("userId"));
  if (!userId.success) return;
  const supabase = await createClient();
  await supabase.rpc("revoke_admin", { p_user: userId.data });
  revalidatePath("/admin", "layout");
}

/** Group status and the tools its members see (spec 007 FR-007). Closed groups reject codes (SQL). */
export async function saveGroupSettings(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = groupSettingsSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const { groupId, status, sharing, encouragement, challenges } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("groups").update({ status, features: { sharing, encouragement, challenges } }).eq("id", groupId);
  if (error) return fromDbError(error);
  revalidatePath("/admin/cohorts", "layout");
  revalidatePath("/community");
  revalidatePath("/stats", "layout");
  return ok(null);
}

/** Sets a new password for a member who forgot theirs (there is no email reset). */
export async function resetPassword(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = resetPasswordSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const userId = await userIdByContact(parsed.data.person);
  if (!userId) return fail("not_found", "person");
  const { error } = await createAdminClient().auth.admin.updateUserById(userId, { password: parsed.data.password });
  if (error) {
    log.error("admin: password reset failed", { code: error.code });
    return fail("invalid_input");
  }
  return ok(null);
}

/** The group new sign-ups join. */
export async function setDefaultGroup(formData: FormData): Promise<void> {
  if (!(await currentAdmin())) return;
  const groupId = uuidSchema.safeParse(formData.get("groupId"));
  if (!groupId.success) return;
  const supabase = await createClient();
  await supabase.rpc("set_default_group", { p_group: groupId.data });
  revalidatePath("/admin", "layout");
}
