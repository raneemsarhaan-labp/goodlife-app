import { describe, expect, it, vi } from "vitest";
import { runCompleteJoin, type JoinDeps } from "@/server/join";

const profile = { fullName: "عضو جديد", email: "new@example.test", timeZone: "Asia/Riyadh" };

function deps(overrides: Partial<JoinDeps> = {}): JoinDeps {
  return {
    checkCode: vi.fn().mockResolvedValue({ error: null }),
    createAuthUser: vi.fn().mockResolvedValue({ id: "auth-1" }),
    redeem: vi.fn().mockResolvedValue({ error: null }),
    deleteAuthUser: vi.fn().mockResolvedValue(undefined),
    sendSignInCode: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("runCompleteJoin", () => {
  it("creates the auth user, redeems, and sends the code", async () => {
    const d = deps();
    const result = await runCompleteJoin(d, "TAYBAH26", profile);
    expect(result).toEqual({ ok: true, data: { email: profile.email } });
    expect(d.redeem).toHaveBeenCalledWith("TAYBAH26", "auth-1", profile);
    expect(d.sendSignInCode).toHaveBeenCalledWith(profile.email);
    expect(d.deleteAuthUser).not.toHaveBeenCalled();
  });

  it("deletes the auth user when redemption fails (no orphaned account)", async () => {
    const d = deps({ redeem: vi.fn().mockResolvedValue({ error: { code: "P0001", message: "code_used_up" } }) });
    const result = await runCompleteJoin(d, "TAYBAH26", profile);
    expect(result).toEqual({ ok: false, error: "code_used_up", field: undefined });
    expect(d.deleteAuthUser).toHaveBeenCalledWith("auth-1");
    expect(d.sendSignInCode).not.toHaveBeenCalled();
  });

  it("stops before creating anything when the code is no longer valid", async () => {
    const d = deps({ checkCode: vi.fn().mockResolvedValue({ error: { code: "P0001", message: "code_expired" } }) });
    const result = await runCompleteJoin(d, "TAYBAH26", profile);
    expect(result).toMatchObject({ ok: false, error: "code_expired" });
    expect(d.createAuthUser).not.toHaveBeenCalled();
  });

  it("reports an existing email as a conflict on the email field", async () => {
    const d = deps({ createAuthUser: vi.fn().mockResolvedValue({ error: "conflict" }) });
    const result = await runCompleteJoin(d, "TAYBAH26", profile);
    expect(result).toEqual({ ok: false, error: "conflict", field: "email" });
    expect(d.redeem).not.toHaveBeenCalled();
  });
});
