"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { log } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { composePhone, identifierSchema, otpSchema, signInSchema, signUpSchema } from "@/lib/validation/onboarding";
import { finishRegistration } from "@/server/registration";
import { runSignUp } from "@/server/join";
import { fail, ok, type Result } from "./result";

export type FormState<T = unknown> = Result<T> | null;
/** Where the code went: what the person typed, and whether it was an email (else the account's email). */
export type CodeSent = { identifier: string; isEmail: boolean };

const field = (error: { issues: { path: PropertyKey[] }[] }) => String(error.issues[0]?.path[0] ?? "");

/** The mobile field: picked country + typed number (see composePhone). */
const phoneFrom = (formData: FormData) => composePhone(formData.get("country") as string | null, String(formData.get("phone") ?? ""));

/** Where a link in the email lands (if the email template carries a link instead of the code). */
async function confirmUrl(): Promise<string> {
  const origin = (await headers()).get("origin") ?? publicEnv.NEXT_PUBLIC_SITE_URL;
  return `${origin}/auth/confirm`;
}

/** The login behind an email: confirmed or not, member or not. */
async function loginFor(email: string): Promise<{ id: string; confirmed: boolean; hasProfile: boolean } | null> {
  const { data } = await createAdminClient().rpc("auth_login_by_email", { p_email: email });
  const row = Array.isArray(data) ? data[0] : data;
  return row ? { id: row.id, confirmed: row.confirmed, hasProfile: row.has_profile } : null;
}

/** The email to send a code to for what was typed: the email itself, or the email of the account with that mobile. */
async function emailFor(identifier: string): Promise<string | null> {
  if (identifier.includes("@")) return identifier;
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("id").eq("phone", identifier).maybeSingle();
  if (!data) return null;
  const { data: auth } = await admin.auth.admin.getUserById(data.id);
  const email = auth.user?.email;
  return email && !email.endsWith(".invalid") ? email : null;
}

/**
 * Emails a 6-digit code: the "Confirm signup" email for an address not confirmed yet, the
 * "Magic Link" email (sign-in code) otherwise. Nothing for an unknown address.
 */
async function sendCode(email: string): Promise<{ error?: string }> {
  const login = await loginFor(email);
  if (!login) return {};
  const supabase = await createClient();
  const emailRedirectTo = await confirmUrl();
  const { error } = login.confirmed
    ? await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo } })
    : await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo } });
  if (error) log.warn("sending a code failed", { code: error.code, status: error.status });
  return error ? { error: error.code ?? String(error.status) } : {};
}

/** Sign up, step 1: name, email, mobile → the code is emailed. */
export async function signUp(_prev: FormState<CodeSent>, formData: FormData): Promise<FormState<CodeSent>> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
    email: formData.get("email") ?? "",
    phone: phoneFrom(formData),
    timeZone: formData.get("timeZone") || undefined,
  });
  if (!parsed.success) return fail("invalid_input", field(parsed.error));

  const admin = createAdminClient();
  const result = await runSignUp(
    {
      taken: async (input) => {
        const [byEmail, byPhone] = await Promise.all([
          admin.from("users").select("id").eq("email", input.email).maybeSingle(),
          admin.from("users").select("id").eq("phone", input.phone).maybeSingle(),
        ]);
        return { email: Boolean(byEmail.data), phone: Boolean(byPhone.data) };
      },
      existingLogin: loginFor,
      deleteAuthUser: async (id) => {
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) log.error("sign-up: could not clear a leftover login", { code: error.code });
      },
      createLogin: async (input) => {
        const { data, error } = await admin.auth.admin.createUser({
          email: input.email,
          email_confirm: false,
          user_metadata: { full_name: input.fullName, phone: input.phone, time_zone: input.timeZone },
        });
        if (data.user && !error) return { id: data.user.id };
        if (error?.code === "email_exists" || error?.code === "user_already_exists") return { error: "exists" };
        log.error("sign-up: could not create the login", { code: error?.code, status: error?.status });
        return { error: "other", detail: error?.code ?? String(error?.status ?? "unknown") };
      },
      sendCode,
    },
    parsed.data,
  );
  return result.ok ? ok({ identifier: result.data.email, isEmail: true }) : result;
}

/** Sign in, step 1: email or mobile → a code to the account's email. Never reveals which accounts exist. */
export async function requestSignInCode(_prev: FormState<CodeSent>, formData: FormData): Promise<FormState<CodeSent>> {
  const identifier = identifierSchema.safeParse(formData.get("identifier") ?? "");
  if (!identifier.success) return fail("invalid_input", "identifier");
  const email = await emailFor(identifier.data);
  if (email) {
    const sent = await sendCode(email);
    if (sent.error) return { ...fail(sent.error.includes("rate_limit") ? "limit_reached" : "generic"), detail: sent.error };
  }
  return ok({ identifier: identifier.data, isEmail: identifier.data.includes("@") });
}

/** Step 2 (sign-up and sign-in): verify the emailed code, register if new, open the app. */
export async function verifyEmailCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const identifier = identifierSchema.safeParse(formData.get("identifier") ?? "");
  const token = otpSchema.safeParse(formData.get("token") ?? "");
  if (!identifier.success || !token.success) return fail("invalid_input", "token");
  const email = await emailFor(identifier.data);
  if (!email) return fail("invalid_input", "token");
  const supabase = await createClient();
  let { error } = await supabase.auth.verifyOtp({ email, token: token.data, type: "email" });
  if (error) ({ error } = await supabase.auth.verifyOtp({ email, token: token.data, type: "signup" }));
  if (error) return fail("invalid_input", "token");
  const registered = await finishRegistration();
  if (!registered.ok) return registered;
  redirect(registered.data === "registered" ? "/welcome" : "/");
}

/** Sends the code again. */
export async function resendEmailCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const identifier = identifierSchema.safeParse(formData.get("identifier") ?? "");
  if (!identifier.success) return fail("invalid_input", "identifier");
  const email = await emailFor(identifier.data);
  const sent = email ? await sendCode(email) : {};
  if (sent.error) return { ...fail(sent.error.includes("rate_limit") ? "limit_reached" : "generic"), detail: sent.error };
  return ok(null);
}

/** Sign in with a password, for accounts that have one. One message for wrong details. */
export async function signInWithPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({ identifier: formData.get("identifier") ?? "", password: formData.get("password") ?? "" });
  if (!parsed.success) return fail("invalid_input", field(parsed.error));
  let email = parsed.data.identifier;
  if (!email.includes("@")) {
    const admin = createAdminClient();
    const { data } = await admin.from("users").select("id").eq("phone", email).maybeSingle();
    const { data: auth } = data ? await admin.auth.admin.getUserById(data.id) : { data: { user: null } };
    email = auth.user?.email ?? `unknown-${Date.now()}@phone.goodlife.invalid`;
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
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
