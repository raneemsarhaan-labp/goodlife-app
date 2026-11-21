"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { encouragementSchema } from "@/lib/validation/community";
import { formObject } from "./admin/guard";
import { fail, fromDbError, ok, type Result } from "./result";

/** Sends a preset encouragement to a fellow group member (FR-040, FR-040a). */
export async function sendEncouragement(_prev: Result<null> | null, formData: FormData): Promise<Result<null> | null> {
  const parsed = encouragementSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input");
  const supabase = await createClient();
  const { error } = await supabase.rpc("send_encouragement", { p_recipient: parsed.data.recipientId, p_phrase: parsed.data.phraseId });
  if (error) return error.code === "23505" ? fail("limit_reached") : fromDbError(error);
  revalidatePath("/community");
  return ok(null);
}
