"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { log } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, invitationCodeSchema, otpSchema, profileSchema } from "@/lib/validation/onboarding";
import { runCompleteJoin } from "@/server/join";
import { fail, fromDbError, ok, type Result } from "./result";

const JOIN_COOKIE = "gl_join_code";

export type FormState<T = unknown> = Result<T> | null;

/** Step 1 of joining: validate the invitation code, remember it, and go to the profile step. */
export async function checkInvitation(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = invitationCodeSchema.safeParse(formData.get("code") ?? "");
  if (!parsed.success) return fail("code_invalid", "code");
  const supabase = await createClient();
  const { error } = await supabase.rpc("check_invitation", { p_code: parsed.data });
  if (error) return fromDbError(error);
  (await cookies()).set(JOIN_COOKIE, parsed.data, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 30,
    path: "/join",
  });
  redirect("/join/profile");
}

/** The code remembered from step 1, if any. */
export async function pendingJoinCode(): Promise<string | null> {
  return (await cookies()).get(JOIN_COOKIE)?.value ?? null;
}

/** Step 2: create the account (contracts/server-actions.md › completeJoin) and send the sign-in code. */
export async function completeJoin(_prev: FormState<{ email: string }>, formData: FormData): Promise<FormState<{ email: string }>> {
  const code = await pendingJoinCode();
  if (!code) return fail("code_invalid");
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    gender: formData.get("gender") ?? "",
    city: formData.get("city") ?? "",
    timeZone: formData.get("timeZone") || undefined,
  });
  if (!parsed.success) return fail("invalid_input", String(parsed.error.issues[0]?.path[0] ?? ""));

  const supabase = await createClient();
  const admin = createAdminClient();
  const result = await runCompleteJoin(
    {
      checkCode: async (c) => supabase.rpc("check_invitation", { p_code: c }),
      createAuthUser: async (email) => {
        const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: false });
        if (error || !data.user) {
          return { error: error?.code === "email_exists" || error?.status === 422 ? "conflict" : "other" };
        }
        return { id: data.user.id };
      },
      redeem: async (c, authUserId, p) =>
        admin.rpc("redeem_invitation", {
          p_code: c,
          p_auth_user: authUserId,
          p_full_name: p.fullName,
          p_email: p.email,
          p_time_zone: p.timeZone,
          p_phone: p.phone,
          p_gender: p.gender,
          p_city: p.city,
        }),
      deleteAuthUser: async (id) => {
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) log.error("join: failed to delete orphaned auth user", { code: error.code });
      },
      sendSignInCode: async (email) => {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
        if (error) log.warn("join: sending sign-in code failed", { code: error.code });
      },
    },
    code,
    parsed.data,
  );
  if (result.ok) (await cookies()).delete({ name: JOIN_COOKIE, path: "/join" });
  return result;
}

/** Sign-in step 1: always reports success, so the form never reveals whether an email exists. */
export async function requestSignInCode(_prev: FormState<{ email: string }>, formData: FormData): Promise<FormState<{ email: string }>> {
  const parsed = emailSchema.safeParse(formData.get("email") ?? "");
  if (!parsed.success) return fail("invalid_input", "email");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email: parsed.data, options: { shouldCreateUser: false } });
  if (error && error.code !== "otp_disabled" && error.code !== "user_not_found") {
    log.warn("sign-in: request code failed", { code: error.code });
  }
  return ok({ email: parsed.data });
}

/** Sign-in step 2: verify the 6-digit code and open the app (or the welcome screen after joining). */
export async function verifySignInCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(formData.get("email") ?? "");
  const token = otpSchema.safeParse(formData.get("token") ?? "");
  if (!email.success || !token.success) return fail("invalid_input", "token");
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: email.data, token: token.data, type: "email" });
  if (error) return fail("invalid_input", "token");
  redirect(formData.get("next") === "welcome" ? "/welcome" : "/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
