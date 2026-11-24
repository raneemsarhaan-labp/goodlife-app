import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/server/actions/result";
import { pendingFromMetadata, registerError } from "@/server/join";

/**
 * Right after the email is confirmed (code or link) or on sign-in: if the signed-in login is not a
 * member yet, register it from the details kept on the login. "member" when it already was one.
 */
export async function finishRegistration(): Promise<Result<"registered" | "member">> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return fail("unauthenticated");
  const admin = createAdminClient();
  const { data: profile } = await admin.from("users").select("id").eq("id", user.id).maybeSingle();
  if (profile) return ok("member");

  const pending = pendingFromMetadata(user.user_metadata);
  if (!pending) {
    await supabase.auth.signOut();
    return fail("not_found");
  }
  const { error } = await admin.rpc("register_member", {
    p_auth_user: user.id,
    p_full_name: pending.fullName,
    p_phone: pending.phone,
    p_time_zone: pending.timeZone,
    p_email: user.email ?? undefined,
  });
  if (error) {
    await supabase.auth.signOut();
    return registerError(error);
  }
  return ok("registered");
}
