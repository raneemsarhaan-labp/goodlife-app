import type { SignUpInput } from "@/lib/validation/onboarding";
import { fail, fromDbError, ok, type Result } from "@/server/actions/result";

type DbError = { code?: string; message?: string } | null;

/** Side effects of signing up, injected so the sequence is unit-testable (tests/unit/sign-up.test.ts). */
export type SignUpDeps = {
  /** Which of the email / mobile already belong to a member. */
  taken(input: SignUpInput): Promise<{ email: boolean; phone: boolean }>;
  /** A login already using the email: confirmed or not, with or without a member profile. */
  existingLogin(email: string): Promise<{ id: string; hasProfile: boolean } | null>;
  deleteAuthUser(id: string): Promise<void>;
  /** Creates the unconfirmed login, keeping name/mobile/time zone until the code is verified. */
  createLogin(input: SignUpInput): Promise<{ id: string } | { error: "exists" | "other"; detail?: string }>;
  sendCode(email: string): Promise<{ error?: string }>;
};

/**
 * Sign up, step 1: (1) refuse an email or mobile that already belongs to a member, (2) clear a
 * leftover login for the email that never became a member, (3) create the unconfirmed login,
 * (4) email the 6-digit code. The member is registered after the code is verified.
 */
export async function runSignUp(deps: SignUpDeps, input: SignUpInput): Promise<Result<{ email: string }>> {
  const taken = await deps.taken(input);
  if (taken.email) return fail("conflict", "email");
  if (taken.phone) return fail("conflict", "phone");

  const existing = await deps.existingLogin(input.email);
  if (existing?.hasProfile) return fail("conflict", "email");
  if (existing) await deps.deleteAuthUser(existing.id);

  const created = await deps.createLogin(input);
  if ("error" in created) {
    return created.error === "exists" ? fail("conflict", "email") : { ...fail("generic"), detail: created.detail };
  }
  const sent = await deps.sendCode(input.email);
  if (sent.error) return { ...fail("generic"), detail: sent.error };
  return ok({ email: input.email });
}

/** What the login carries until it is confirmed (auth user metadata). */
export type PendingMember = { fullName: string; phone: string; timeZone: string };

export function pendingFromMetadata(meta: Record<string, unknown> | undefined): PendingMember | null {
  const fullName = typeof meta?.full_name === "string" ? meta.full_name : "";
  const phone = typeof meta?.phone === "string" ? meta.phone : "";
  const timeZone = typeof meta?.time_zone === "string" ? meta.time_zone : "Asia/Riyadh";
  return fullName && phone ? { fullName, phone, timeZone } : null;
}

/** Maps register_member's errors to what the person sees. */
export function registerError(error: NonNullable<DbError>): Result<never> {
  const message = error.message ?? "";
  if (message.startsWith("conflict: phone")) return fail("conflict", "phone");
  if (message.startsWith("conflict: email")) return fail("conflict", "email");
  if (message.startsWith("not_found: group")) return fail("signup_closed");
  return fromDbError(error);
}
