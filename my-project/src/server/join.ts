import type { ProfileInput } from "@/lib/validation/onboarding";
import { fail, fromDbError, ok, type Result } from "@/server/actions/result";

type DbError = { code?: string; message?: string } | null;

/** Side effects of joining, injected so the sequence is unit-testable (tests/unit/complete-join.test.ts). */
export type JoinDeps = {
  checkCode(code: string): Promise<{ error: DbError }>;
  createAuthUser(email: string): Promise<{ id: string } | { error: "conflict" | "other" }>;
  redeem(code: string, authUserId: string, profile: ProfileInput): Promise<{ error: DbError }>;
  deleteAuthUser(id: string): Promise<void>;
  sendSignInCode(email: string): Promise<void>;
};

/**
 * completeJoin (contracts/server-actions.md): (1) re-check the code, (2) create the auth user
 * with the server-only admin client, (3) redeem the code for it, (4) delete the auth user if
 * redemption fails, (5) send the one-time sign-in code.
 */
export async function runCompleteJoin(
  deps: JoinDeps,
  code: string,
  profile: ProfileInput,
): Promise<Result<{ email: string }>> {
  const check = await deps.checkCode(code);
  if (check.error) return fromDbError(check.error);

  const created = await deps.createAuthUser(profile.email);
  if ("error" in created) return created.error === "conflict" ? fail("conflict", "email") : fail("invalid_input");

  const redeemed = await deps.redeem(code, created.id, profile);
  if (redeemed.error) {
    await deps.deleteAuthUser(created.id);
    return fromDbError(redeemed.error);
  }

  await deps.sendSignInCode(profile.email);
  return ok({ email: profile.email });
}
