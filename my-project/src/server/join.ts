import type { SignUpInput } from "@/lib/validation/onboarding";
import { fail, fromDbError, ok, type Result } from "@/server/actions/result";

type DbError = { code?: string; message?: string } | null;

/** Side effects of signing up, injected so the sequence is unit-testable (tests/unit/complete-join.test.ts). */
export type SignUpDeps = {
  /** Whether an account already uses this mobile. */
  phoneTaken(phone: string): Promise<boolean>;
  createAuthUser(phone: string, password: string): Promise<{ id: string } | { error: "exists" | "other" }>;
  register(authUserId: string, input: SignUpInput): Promise<{ error: DbError }>;
  deleteAuthUser(id: string): Promise<void>;
  signIn(phone: string, password: string): Promise<boolean>;
};

/**
 * Sign up: (1) refuse a mobile that is already registered, (2) create the login, (3) create the
 * member (default group, plan), undoing the login if that fails, (4) sign in.
 */
export async function runSignUp(deps: SignUpDeps, input: SignUpInput): Promise<Result<{ signedIn: boolean }>> {
  if (await deps.phoneTaken(input.phone)) return fail("conflict", "phone");

  const created = await deps.createAuthUser(input.phone, input.password);
  if ("error" in created) return created.error === "exists" ? fail("conflict", "phone") : fail("generic");

  const registered = await deps.register(created.id, input);
  if (registered.error) {
    await deps.deleteAuthUser(created.id);
    const message = registered.error.message ?? "";
    if (message.startsWith("conflict")) return fail("conflict", "phone");
    if (message.startsWith("not_found: group")) return fail("signup_closed");
    return fromDbError(registered.error);
  }
  return ok({ signedIn: await deps.signIn(input.phone, input.password) });
}
