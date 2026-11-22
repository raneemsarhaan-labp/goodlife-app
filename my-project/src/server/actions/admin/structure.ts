"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cohortSchema, groupSchema, personInGroupSchema, userInGroupSchema, groupSettingsSchema } from "@/lib/validation/admin";
import { emailSchema } from "@/lib/validation/onboarding";
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

async function userIdByEmail(email: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
  return data?.id ?? null;
}

/** Assign a facilitator by email (the person must already have an account). */
export async function assignFacilitator(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = personInGroupSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", "email");
  const userId = await userIdByEmail(parsed.data.email);
  if (!userId) return fail("not_found", "email");
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
  if (!parsed.success) return fail("invalid_input", "email");
  const userId = await userIdByEmail(parsed.data.email);
  if (!userId) return fail("not_found", "email");
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_member", { p_user: userId, p_group: parsed.data.groupId });
  if (error) return error.message.startsWith("conflict") ? fail("conflict", "email") : fromDbError(error);
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
  const email = emailSchema.safeParse(formData.get("email") ?? "");
  if (!email.success) return fail("invalid_input", "email");
  const userId = await userIdByEmail(email.data);
  if (!userId) return fail("not_found", "email");
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
