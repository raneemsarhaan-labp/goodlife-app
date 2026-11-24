import { describe, expect, it, vi } from "vitest";
import { composePhone, identifierSchema, loginEmailFor, normalizePhone, signUpSchema } from "@/lib/validation/onboarding";
import { countryForZone } from "@/lib/countries";
import { pendingFromMetadata, registerError, runSignUp, type SignUpDeps } from "@/server/join";

const input = {
  fullName: "عضو جديد",
  email: "new@example.test",
  phone: "+966500000101",
  timeZone: "Asia/Riyadh",
};

function deps(overrides: Partial<SignUpDeps> = {}): SignUpDeps {
  return {
    taken: vi.fn().mockResolvedValue({ email: false, phone: false }),
    existingLogin: vi.fn().mockResolvedValue(null),
    deleteAuthUser: vi.fn().mockResolvedValue(undefined),
    createLogin: vi.fn().mockResolvedValue({ id: "auth-1" }),
    sendCode: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

describe("runSignUp", () => {
  it("creates the unconfirmed login and emails the code", async () => {
    const d = deps();
    expect(await runSignUp(d, input)).toEqual({ ok: true, data: { email: input.email } });
    expect(d.createLogin).toHaveBeenCalledWith(input);
    expect(d.sendCode).toHaveBeenCalledWith(input.email);
  });

  it("says the email or the mobile is already registered, before creating anything", async () => {
    const byEmail = deps({ taken: vi.fn().mockResolvedValue({ email: true, phone: false }) });
    expect(await runSignUp(byEmail, input)).toEqual({ ok: false, error: "conflict", field: "email" });
    const byPhone = deps({ taken: vi.fn().mockResolvedValue({ email: false, phone: true }) });
    expect(await runSignUp(byPhone, input)).toEqual({ ok: false, error: "conflict", field: "phone" });
    expect(byEmail.createLogin).not.toHaveBeenCalled();
    expect(byPhone.createLogin).not.toHaveBeenCalled();
  });

  it("clears a leftover login that never became a member, then starts again", async () => {
    const d = deps({ existingLogin: vi.fn().mockResolvedValue({ id: "old", hasProfile: false }) });
    expect(await runSignUp(d, input)).toMatchObject({ ok: true });
    expect(d.deleteAuthUser).toHaveBeenCalledWith("old");
  });

  it("refuses an email whose login already belongs to a member", async () => {
    const d = deps({ existingLogin: vi.fn().mockResolvedValue({ id: "m", hasProfile: true }) });
    expect(await runSignUp(d, input)).toEqual({ ok: false, error: "conflict", field: "email" });
    expect(d.deleteAuthUser).not.toHaveBeenCalled();
  });

  it("passes on why the login or the email failed", async () => {
    const login = deps({ createLogin: vi.fn().mockResolvedValue({ error: "other", detail: "email_address_invalid" }) });
    expect(await runSignUp(login, input)).toMatchObject({ ok: false, error: "generic", detail: "email_address_invalid" });
    const mail = deps({ sendCode: vi.fn().mockResolvedValue({ error: "over_email_send_rate_limit" }) });
    expect(await runSignUp(mail, input)).toMatchObject({ ok: false, error: "generic", detail: "over_email_send_rate_limit" });
  });
});

describe("after the code", () => {
  it("reads the kept details from the login", () => {
    expect(pendingFromMetadata({ full_name: "عضو", phone: "+966500000101", time_zone: "Africa/Cairo" })).toEqual({
      fullName: "عضو",
      phone: "+966500000101",
      timeZone: "Africa/Cairo",
    });
    expect(pendingFromMetadata({})).toBeNull();
  });

  it("maps registration conflicts to the right field", () => {
    expect(registerError({ code: "P0001", message: "conflict: phone" })).toEqual({ ok: false, error: "conflict", field: "phone" });
    expect(registerError({ code: "P0001", message: "conflict: email" })).toEqual({ ok: false, error: "conflict", field: "email" });
    expect(registerError({ code: "P0001", message: "not_found: group" })).toMatchObject({ ok: false, error: "signup_closed" });
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

  it("validates sign-up: email and mobile", () => {
    expect(signUpSchema.safeParse({ ...input, phone: "0500000101" }).success).toBe(true);
    expect(signUpSchema.safeParse({ ...input, phone: "12345" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...input, email: "not-an-email" }).success).toBe(false);
  });

  it.each([
    ["20", "01270600400", "+201270600400"],
    ["20", "1270600400", "+201270600400"],
    ["20", "0201270600400", "+201270600400"],
    ["20", "201270600400", "+201270600400"],
    ["966", "0500000101", "+966500000101"],
    ["966", "٠٥٠٠٠٠٠١٠١", "+966500000101"],
    ["966", "+201270600400", "+201270600400"],
    ["20", "00966500000101", "+966500000101"],
    ["971", "0501234567", "+971501234567"],
  ])("country %s + %s → %s", (country, typed, expected) => {
    expect(normalizePhone(composePhone(country, typed))).toBe(expected);
  });

  it("does not attach the wrong country to a Saudi or Egyptian number", () => {
    expect(normalizePhone(composePhone("966", "01270600400"))).toBe("+201270600400");
    expect(normalizePhone(composePhone("20", "0500000101"))).toBe("+966500000101");
    expect(signUpSchema.safeParse({ ...input, phone: composePhone("966", "12345") }).success).toBe(false);
  });

  it("preselects the country from the device time zone", () => {
    expect(countryForZone("Africa/Cairo")).toBe("20");
    expect(countryForZone("Asia/Riyadh")).toBe("966");
    expect(countryForZone("Pacific/Auckland")).toBe("966");
  });

  it("signs in with an email or a mobile number", () => {
    expect(identifierSchema.parse(" Me@Example.test ")).toBe("me@example.test");
    expect(identifierSchema.parse("01270600400")).toBe("+201270600400");
    expect(identifierSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("maps a mobile to its mail-less login", () => {
    expect(loginEmailFor("+966500000101")).toBe("p966500000101@phone.goodlife.invalid");
  });
});
