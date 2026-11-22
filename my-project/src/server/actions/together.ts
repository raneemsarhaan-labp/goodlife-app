"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/common";
import { fail, fromDbError, ok, type Result } from "./result";

function refresh() {
  revalidatePath("/stats/challenge");
  revalidatePath("/");
  revalidatePath("/plan");
}

/** «انضمّ» (spec 007 FR-004): creates the locked challenge habit. */
export async function joinChallenge(challengeId: string): Promise<Result<null>> {
  const id = uuidSchema.safeParse(challengeId);
  if (!id.success) return fail("invalid_input");
  const supabase = await createClient();
  const { error } = await supabase.rpc("join_group_challenge", { p_challenge: id.data });
  if (error) return fromDbError(error);
  refresh();
  return ok(null);
}

/** «انسحب من التحدّي»: archives the challenge habit. */
export async function withdrawChallenge(challengeId: string): Promise<Result<null>> {
  const id = uuidSchema.safeParse(challengeId);
  if (!id.success) return fail("invalid_input");
  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_group_challenge", { p_challenge: id.data });
  if (error) return fromDbError(error);
  refresh();
  return ok(null);
}
