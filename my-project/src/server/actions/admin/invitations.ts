"use server";

import { revalidatePath } from "next/cache";
import { generateCodes } from "@/lib/codes";
import { createClient } from "@/lib/supabase/server";
import { invitationsSchema } from "@/lib/validation/admin";
import { uuidSchema } from "@/lib/validation/common";
import { fail, fromDbError, ok, type Result } from "../result";
import { currentAdmin, firstIssuePath, formObject } from "./guard";

/** Generates invitation codes for a group (and its cohort). Retries on the rare code collision. */
export async function createInvitations(
  _prev: Result<{ codes: string[] }> | null,
  formData: FormData,
): Promise<Result<{ codes: string[] }> | null> {
  const admin = await currentAdmin();
  if (!admin) return fail("forbidden");
  const parsed = invitationsSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const supabase = await createClient();
  const { data: group } = await supabase.from("groups").select("id, cohort_id").eq("id", parsed.data.groupId).maybeSingle();
  if (!group) return fail("not_found", "groupId");

  const expiresAt = new Date(Date.now() + parsed.data.expiresInDays * 86_400_000).toISOString();
  for (let attempt = 0; attempt < 3; attempt++) {
    const codes = generateCodes(parsed.data.count);
    const { error } = await supabase.from("invitation_codes").insert(
      codes.map((code) => ({
        code,
        cohort_id: group.cohort_id,
        group_id: group.id,
        expires_at: expiresAt,
        max_uses: parsed.data.maxUses,
        created_by: admin.id,
      })),
    );
    if (!error) {
      revalidatePath("/admin/invitations");
      return ok({ codes });
    }
    if (error.code !== "23505") return fromDbError(error);
  }
  return fail("conflict");
}

export async function revokeInvitation(formData: FormData): Promise<void> {
  if (!(await currentAdmin())) return;
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("invitation_codes").update({ revoked_at: new Date().toISOString() }).eq("id", id.data).is("revoked_at", null);
  revalidatePath("/admin/invitations");
}
