"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/common";
import { reflectionSchema } from "@/lib/validation/reflections";
import { fail, fromDbError, ok, type Result } from "./result";

/**
 * Saves a «وقفة تأمل» (spec 003 FR-003, FR-008). Called directly and by the offline outbox;
 * idempotent on clientMutationId, so a replay is stored once.
 */
export async function saveReflection(input: unknown): Promise<Result<{ id: string }>> {
  const parsed = reflectionSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_input", "text");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_reflection", {
    p_text: parsed.data.text,
    p_client_mutation_id: parsed.data.clientMutationId,
    p_local_date: parsed.data.localDate,
  });
  if (error) return fromDbError(error);
  revalidatePath("/plan/reflections");
  return ok({ id: data as string });
}

/** Deletes one of the member's own «وقفة تأمل» notes (FR-005; RLS: self only). */
export async function deleteReflection(formData: FormData): Promise<void> {
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("reflections").delete().eq("id", id.data);
  revalidatePath("/plan/reflections");
}
