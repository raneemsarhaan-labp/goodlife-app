import { describe, expect, it, vi } from "vitest";
import { loginEmailFor, normalizePhone, signUpSchema } from "@/lib/validation/onboarding";
import { runSignUp, type SignUpDeps } from "@/server/join";

const input = { fullName: "عضو جديد", phone: "+966500000101", password: "secret123", confirmPassword: "secret123", timeZone: "Asia/Riyadh" };

function deps(overrides: Partial<SignUpDeps> = {}): SignUpDeps {
  return {
    phoneTaken: vi.fn().mockResolvedValue(false),
    createAuthUser: vi.fn().mockResolvedValue({ id: "auth-1" }),
    register: vi.fn().mockResolvedValue({ error: null }),
    deleteAuthUser: vi.fn().mockResolvedValue(undefined),
    signIn: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("runSignUp", () => {
  it("creates the login and the member, then signs in", async () => {
    const d = deps();
    expect(await runSignUp(d, input)).toEqual({ ok: true, data: { signedIn: true } });
    expect(d.createAuthUser).toHaveBeenCalledWith(input.phone, input.password);
    expect(d.register).toHaveBeenCalledWith("auth-1", input);
    expect(d.signIn).toHaveBeenCalledWith(input.phone, input.password);
  });

  it("says the mobile is already registered, before creating anything", async () => {
    const d = deps({ phoneTaken: vi.fn().mockResolvedValue(true) });
    expect(await runSignUp(d, input)).toEqual({ ok: false, error: "conflict", field: "phone" });
    expect(d.createAuthUser).not.toHaveBeenCalled();
  });

  it("treats an existing login for the mobile as already registered", async () => {
    const d = deps({ createAuthUser: vi.fn().mockResolvedValue({ error: "exists" }) });
    expect(await runSignUp(d, input)).toEqual({ ok: false, error: "conflict", field: "phone" });
  });

  it("removes the login when the member cannot be created", async () => {
    const d = deps({ register: vi.fn().mockResolvedValue({ error: { code: "P0001", message: "not_found: group" } }) });
    expect(await runSignUp(d, input)).toEqual({ ok: false, error: "signup_closed", field: undefined });
    expect(d.deleteAuthUser).toHaveBeenCalledWith("auth-1");
    expect(d.signIn).not.toHaveBeenCalled();
  });

  it("reports a race on the same mobile as already registered", async () => {
    const d = deps({ register: vi.fn().mockResolvedValue({ error: { code: "P0001", message: "conflict: phone" } }) });
    expect(await runSignUp(d, input)).toEqual({ ok: false, error: "conflict", field: "phone" });
    expect(d.deleteAuthUser).toHaveBeenCalled();
  });
});

describe("mobile numbers", () => {
  it.each([
    ["0500000101", "+966500000101"],
    ["٠٥٠٠٠٠٠١٠١", "+966500000101"],
    ["500000101", "+966500000101"],
    ["00966 50 000 0101", "+966500000101"],
    ["+966-50-000-0101", "+966500000101"],
    ["+201001234567", "+201001234567"],
    ["0201270600400", "+201270600400"],
    ["01270600400", "+201270600400"],
    ["201270600400", "+201270600400"],
    ["00201270600400", "+201270600400"],
    ["٠١٢٧٠٦٠٠٤٠٠", "+201270600400"],
    ["0966500000101", "+966500000101"],
    ["966500000101", "+966500000101"],
    ["0971501234567", "+971501234567"],
  ])("normalizes %s", (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });

  it("validates sign-up: mobile format, password length and match", () => {
    expect(signUpSchema.safeParse({ ...input, phone: "0500000101" }).success).toBe(true);
    expect(signUpSchema.safeParse({ ...input, phone: "12345" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...input, password: "short", confirmPassword: "short" }).success).toBe(false);
    const mismatch = signUpSchema.safeParse({ ...input, confirmPassword: "different1" });
    expect(mismatch.success).toBe(false);
    expect(mismatch.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  it("maps a mobile to its mail-less login", () => {
    expect(loginEmailFor("+966500000101")).toBe("p966500000101@phone.goodlife.invalid");
  });
});
