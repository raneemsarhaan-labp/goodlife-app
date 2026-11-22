import { describe, expect, it, vi } from "vitest";
import { runCompleteJoin, runFinishJoin, type FinishJoinDeps, type JoinDeps } from "@/server/join";

const profile = { fullName: "عضو جديد", email: "new@example.test", timeZone: "Asia/Riyadh" };

function deps(overrides: Partial<JoinDeps> = {}): JoinDeps {
  return {
    checkCode: vi.fn().mockResolvedValue({ error: null }),
    memberExists: vi.fn().mockResolvedValue(false),
    createAuthUser: vi.fn().mockResolvedValue({ id: "auth-1" }),
    savePending: vi.fn().mockResolvedValue(undefined),
    sendSignInCode: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("runCompleteJoin", () => {
  it("keeps the entry and emails a code, without creating any membership yet", async () => {
    const d = deps();
    const result = await runCompleteJoin(d, "TAYBAH26", profile);
    expect(result).toEqual({ ok: true, data: { email: profile.email } });
    expect(d.savePending).toHaveBeenCalledWith({ code: "TAYBAH26", profile });
    expect(d.sendSignInCode).toHaveBeenCalledWith(profile.email);
  });

  it("carries on when a login (without membership) already exists for the email", async () => {
    const d = deps({ createAuthUser: vi.fn().mockResolvedValue({ error: "exists" }) });
    expect(await runCompleteJoin(d, "TAYBAH26", profile)).toMatchObject({ ok: true });
    expect(d.sendSignInCode).toHaveBeenCalled();
  });

  it("refuses an email that already belongs to a member", async () => {
    const d = deps({ memberExists: vi.fn().mockResolvedValue(true) });
    expect(await runCompleteJoin(d, "TAYBAH26", profile)).toEqual({ ok: false, error: "conflict", field: "email" });
    expect(d.createAuthUser).not.toHaveBeenCalled();
    expect(d.sendSignInCode).not.toHaveBeenCalled();
  });

  it("stops before anything when the code is no longer valid", async () => {
    const d = deps({ checkCode: vi.fn().mockResolvedValue({ error: { code: "P0001", message: "code_expired" } }) });
    expect(await runCompleteJoin(d, "TAYBAH26", profile)).toMatchObject({ ok: false, error: "code_expired" });
    expect(d.createAuthUser).not.toHaveBeenCalled();
  });
});

describe("runFinishJoin", () => {
  const finish = (overrides: Partial<FinishJoinDeps> = {}): FinishJoinDeps => ({
    redeem: vi.fn().mockResolvedValue({ error: null }),
    clearPending: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  });
  const pending = { code: "TAYBAH26", profile };

  it("redeems the invitation for the account that verified the email", async () => {
    const d = finish();
    expect(await runFinishJoin(d, pending, { id: "auth-1", email: "NEW@example.test" })).toEqual({ ok: true, data: null });
    expect(d.redeem).toHaveBeenCalledWith("TAYBAH26", "auth-1", profile);
    expect(d.clearPending).toHaveBeenCalled();
  });

  it("refuses when the verified email is not the one entered", async () => {
    const d = finish();
    expect(await runFinishJoin(d, pending, { id: "auth-2", email: "other@example.test" })).toMatchObject({ ok: false, error: "forbidden" });
    expect(d.redeem).not.toHaveBeenCalled();
  });

  it("reports a code that expired meanwhile", async () => {
    const d = finish({ redeem: vi.fn().mockResolvedValue({ error: { code: "P0001", message: "code_expired" } }) });
    expect(await runFinishJoin(d, pending, { id: "auth-1", email: profile.email })).toMatchObject({ ok: false, error: "code_expired" });
    expect(d.clearPending).not.toHaveBeenCalled();
  });
});
