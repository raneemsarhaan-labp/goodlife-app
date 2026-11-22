"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { log } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, invitationCodeSchema, otpSchema, profileSchema } from "@/lib/validation/onboarding";
import { runCompleteJoin } from "@/server/join";
import { finishPendingJoin, savePendingJoin } from "@/server/join-session";
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

/**
 * Step 2 (contracts/server-actions.md › completeJoin): check everything and email the 6-digit code.
 * Membership is created only after that code is entered (verifySignInCode → finishPendingJoin), so
 * joining proves the email belongs to the person joining.
 */
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
  return runCompleteJoin(
    {
      checkCode: async (c) => supabase.rpc("check_invitation", { p_code: c }),
      memberExists: async (email) => {
        const { data } = await admin.from("users").select("id").eq("email", email.toLowerCase()).maybeSingle();
        return Boolean(data);
      },
      // A login with no membership yet. Confirmed at creation, because Supabase answers an
      // unconfirmed address with its "confirm your signup" link instead of the sign-in code; the
      // address is proven when the code is entered, before any membership exists.
      createAuthUser: async (email) => {
        const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
        if (error || !data.user) return { error: error?.code === "email_exists" || error?.status === 422 ? "exists" : "other" };
        return { id: data.user.id };
      },
      savePending: savePendingJoin,
      sendSignInCode: async (email) => {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: await confirmUrl() } });
        if (error) log.warn("join: sending sign-in code failed", { code: error.code });
      },
    },
    code,
    parsed.data,
  );
}

/** Where the email's sign-in link should land (when the email template carries a link, not the code). */
async function confirmUrl(): Promise<string> {
  const origin = (await headers()).get("origin") ?? publicEnv.NEXT_PUBLIC_SITE_URL;
  return `${origin}/auth/confirm`;
}

/** Sign-in step 1: always reports success, so the form never reveals whether an email exists. */
export async function requestSignInCode(_prev: FormState<{ email: string }>, formData: FormData): Promise<FormState<{ email: string }>> {
  const parsed = emailSchema.safeParse(formData.get("email") ?? "");
  if (!parsed.success) return fail("invalid_input", "email");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: false, emailRedirectTo: await confirmUrl() },
  });
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
  const joined = await finishPendingJoin();
  if (!joined.ok) {
    await supabase.auth.signOut();
    return joined;
  }
  redirect(joined.data === "joined" || formData.get("next") === "welcome" ? "/welcome" : "/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
