"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { log } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { composePhone, emailSchema, loginEmailFor, otpSchema, signInSchema, signUpSchema } from "@/lib/validation/onboarding";
import { finishRegistration } from "@/server/registration";
import { runSignUp } from "@/server/join";
import { fail, ok, type Result } from "./result";

export type FormState<T = unknown> = Result<T> | null;

const field = (error: { issues: { path: PropertyKey[] }[] }) => String(error.issues[0]?.path[0] ?? "");

/** The mobile field: picked country + typed number (see composePhone). */
const phoneFrom = (formData: FormData) => composePhone(formData.get("country") as string | null, String(formData.get("phone") ?? ""));

/** Where a link in the email lands (if the email template carries a link instead of the code). */
async function confirmUrl(): Promise<string> {
  const origin = (await headers()).get("origin") ?? publicEnv.NEXT_PUBLIC_SITE_URL;
  return `${origin}/auth/confirm`;
}

/** Emails the 6-digit code for an unconfirmed login ("Confirm signup" email). */
async function sendSignUpCode(email: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: await confirmUrl() } });
  if (error) log.warn("sign-up: sending the code failed", { code: error.code, status: error.status });
  return error ? { error: error.code ?? String(error.status) } : {};
}

/** Sign up, step 1: name, email, mobile, password → the code is emailed. */
export async function signUp(_prev: FormState<{ email: string }>, formData: FormData): Promise<FormState<{ email: string }>> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
    email: formData.get("email") ?? "",
    phone: phoneFrom(formData),
    password: formData.get("password") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
    timeZone: formData.get("timeZone") || undefined,
  });
  if (!parsed.success) return fail("invalid_input", field(parsed.error));

  const admin = createAdminClient();
  return runSignUp(
    {
      taken: async (input) => {
        const [byEmail, byPhone] = await Promise.all([
          admin.from("users").select("id").eq("email", input.email).maybeSingle(),
          admin.from("users").select("id").eq("phone", input.phone).maybeSingle(),
        ]);
        return { email: Boolean(byEmail.data), phone: Boolean(byPhone.data) };
      },
      existingLogin: async (email) => {
        const { data } = await admin.rpc("auth_login_by_email", { p_email: email });
        const row = Array.isArray(data) ? data[0] : data;
        return row ? { id: row.id, hasProfile: row.has_profile } : null;
      },
      deleteAuthUser: async (id) => {
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) log.error("sign-up: could not clear a leftover login", { code: error.code });
      },
      createLogin: async (input) => {
        const { data, error } = await admin.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: false,
          user_metadata: { full_name: input.fullName, phone: input.phone, time_zone: input.timeZone },
        });
        if (data.user && !error) return { id: data.user.id };
        if (error?.code === "email_exists" || error?.code === "user_already_exists") return { error: "exists" };
        log.error("sign-up: could not create the login", { code: error?.code, status: error?.status });
        return { error: "other", detail: error?.code ?? String(error?.status ?? "unknown") };
      },
      sendCode: sendSignUpCode,
    },
    parsed.data,
  );
}

/** Sign up, step 2 (and an unconfirmed sign-in): verify the emailed code, register, open the app. */
export async function verifyEmailCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(formData.get("email") ?? "");
  const token = otpSchema.safeParse(formData.get("token") ?? "");
  if (!email.success || !token.success) return fail("invalid_input", "token");
  const supabase = await createClient();
  let { error } = await supabase.auth.verifyOtp({ email: email.data, token: token.data, type: "signup" });
  if (error) ({ error } = await supabase.auth.verifyOtp({ email: email.data, token: token.data, type: "email" }));
  if (error) return fail("invalid_input", "token");
  const registered = await finishRegistration();
  if (!registered.ok) return registered;
  redirect(registered.data === "registered" ? "/welcome" : "/");
}

/** Sends the code again. */
export async function resendEmailCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(formData.get("email") ?? "");
  if (!email.success) return fail("invalid_input", "email");
  const sent = await sendSignUpCode(email.data);
  return sent.error ? { ...fail("generic"), detail: sent.error } : ok(null);
}

/** The login email for what was typed: the email itself, or the login behind a mobile number. */
async function loginEmail(identifier: string): Promise<string> {
  if (identifier.includes("@")) return identifier;
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("id").eq("phone", identifier).maybeSingle();
  if (data) {
    const { data: auth } = await admin.auth.admin.getUserById(data.id);
    if (auth.user?.email) return auth.user.email;
  }
  return loginEmailFor(identifier);
}

/**
 * Sign in with email or mobile + password. One message for wrong details, so it never reveals which
 * accounts exist. An email not yet confirmed gets a fresh code instead.
 */
export async function signIn(_prev: FormState<{ confirmEmail: string }>, formData: FormData): Promise<FormState<{ confirmEmail: string }>> {
  const parsed = signInSchema.safeParse({ identifier: formData.get("identifier") ?? "", password: formData.get("password") ?? "" });
  if (!parsed.success) return fail("invalid_input", field(parsed.error));
  const email = await loginEmail(parsed.data.identifier);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error?.code === "email_not_confirmed") {
    const sent = await sendSignUpCode(email);
    return sent.error ? { ...fail("generic"), detail: sent.error } : ok({ confirmEmail: email });
  }
  if (error) {
    if (error.code !== "invalid_credentials") log.warn("sign-in failed", { code: error.code });
    return error.code === "invalid_credentials" ? fail("invalid_input", "password") : { ...fail("generic"), detail: error.code ?? String(error.status) };
  }
  const registered = await finishRegistration();
  if (!registered.ok) return registered;
  redirect(registered.data === "registered" ? "/welcome" : "/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
