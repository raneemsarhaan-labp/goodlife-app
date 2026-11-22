import type { ProfileInput } from "@/lib/validation/onboarding";
import { fail, fromDbError, ok, type Result } from "@/server/actions/result";

type DbError = { code?: string; message?: string } | null;

/** What a new member entered, kept (server-side cookie) until they prove the email is theirs. */
export type PendingJoin = { code: string; profile: ProfileInput };

/** Side effects of joining, injected so the sequence is unit-testable (tests/unit/complete-join.test.ts). */
export type JoinDeps = {
  checkCode(code: string): Promise<{ error: DbError }>;
  /** Whether a member profile already uses this email. */
  memberExists(email: string): Promise<boolean>;
  /** Creates the login for the email; "exists" when one is already there without a profile. */
  createAuthUser(email: string): Promise<{ id: string } | { error: "exists" | "other" }>;
  savePending(pending: PendingJoin): Promise<void>;
  sendSignInCode(email: string): Promise<void>;
};

/**
 * Join step 2 (contracts/server-actions.md › completeJoin): (1) re-check the code, (2) refuse an email
 * that already belongs to a member, (3) make sure a login exists for the email, (4) keep what was
 * entered, (5) email the 6-digit code. Nothing is redeemed yet: membership is created only once the
 * code from that inbox is entered (runFinishJoin), so nobody can join with someone else's email.
 */
export async function runCompleteJoin(deps: JoinDeps, code: string, profile: ProfileInput): Promise<Result<{ email: string }>> {
  const check = await deps.checkCode(code);
  if (check.error) return fromDbError(check.error);
  if (await deps.memberExists(profile.email)) return fail("conflict", "email");

  const created = await deps.createAuthUser(profile.email);
  if ("error" in created && created.error === "other") return fail("invalid_input");

  await deps.savePending({ code, profile });
  await deps.sendSignInCode(profile.email);
  return ok({ email: profile.email });
}

export type FinishJoinDeps = {
  redeem(code: string, authUserId: string, profile: ProfileInput): Promise<{ error: DbError }>;
  clearPending(): Promise<void>;
};

/**
 * After the emailed code is verified: redeem the invitation for the verified account. The signed-in
 * email must be the one entered when joining.
 */
export async function runFinishJoin(
  deps: FinishJoinDeps,
  pending: PendingJoin,
  verified: { id: string; email: string },
): Promise<Result<null>> {
  if (verified.email.toLowerCase() !== pending.profile.email.toLowerCase()) return fail("forbidden");
  const redeemed = await deps.redeem(pending.code, verified.id, pending.profile);
  if (redeemed.error) return fromDbError(redeemed.error);
  await deps.clearPending();
  return ok(null);
}
