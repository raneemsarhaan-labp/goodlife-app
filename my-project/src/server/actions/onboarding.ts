"use server";

import { redirect } from "next/navigation";
import { log } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { composePhone, loginEmailFor, signInSchema, signUpSchema } from "@/lib/validation/onboarding";
import { runSignUp } from "@/server/join";
import { fail, fromDbError, type Result } from "./result";

export type FormState<T = unknown> = Result<T> | null;

/** The mobile field: picked country + typed number (see composePhone). */
const phoneFrom = (formData: FormData) => composePhone(formData.get("country") as string | null, String(formData.get("phone") ?? ""));

const field = (error: { issues: { path: PropertyKey[] }[] }) => String(error.issues[0]?.path[0] ?? "");

/** The login email behind a mobile: the account's own email if it has one, else the mobile login. */
async function loginEmailForPhone(phone: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("id").eq("phone", phone).maybeSingle();
  if (data) {
    const { data: auth } = await admin.auth.admin.getUserById(data.id);
    if (auth.user?.email) return auth.user.email;
  }
  return loginEmailFor(phone);
}

/** New account: name, mobile, password. Joins the default group and opens the welcome screen. */
export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
    phone: phoneFrom(formData),
    password: formData.get("password") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
    timeZone: formData.get("timeZone") || undefined,
  });
  if (!parsed.success) return fail("invalid_input", field(parsed.error));

  const admin = createAdminClient();
  const supabase = await createClient();
  const result = await runSignUp(
    {
      phoneTaken: async (phone) => {
        const { data } = await admin.from("users").select("id").eq("phone", phone).maybeSingle();
        return Boolean(data);
      },
      createAuthUser: async (phone, password) => {
        const { data, error } = await admin.auth.admin.createUser({
          email: loginEmailFor(phone),
          password,
          email_confirm: true,
          user_metadata: { phone },
        });
        if (error || !data.user) {
          if (error?.code === "email_exists" || error?.status === 422) return { error: "exists" };
          log.error("sign-up: could not create the login", { code: error?.code, status: error?.status });
          return { error: "other" };
        }
        return { id: data.user.id };
      },
      register: async (id, input) =>
        admin.rpc("register_member", { p_auth_user: id, p_full_name: input.fullName, p_phone: input.phone, p_time_zone: input.timeZone }),
      deleteAuthUser: async (id) => {
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) log.error("sign-up: failed to delete orphaned login", { code: error.code });
      },
      signIn: async (phone, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email: loginEmailFor(phone), password });
        return !error;
      },
    },
    parsed.data,
  );
  if (!result.ok) return result;
  redirect(result.data.signedIn ? "/welcome" : "/sign-in");
}

/** Sign in with mobile + password. One message for every failure, so it never reveals which numbers exist. */
export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({ phone: phoneFrom(formData), password: formData.get("password") ?? "" });
  if (!parsed.success) return fail("invalid_input", field(parsed.error));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: await loginEmailForPhone(parsed.data.phone),
    password: parsed.data.password,
  });
  if (error) {
    if (error.code !== "invalid_credentials") log.warn("sign-in failed", { code: error.code });
    return error.code === "invalid_credentials" ? fail("invalid_input", "password") : fromDbError({ message: error.message });
  }
  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
