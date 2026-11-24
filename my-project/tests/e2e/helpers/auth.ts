import { expect, type Page } from "@playwright/test";

/** Seed accounts (supabase/seed.sql): mobile numbers; every seed password is goodlife123. */
const SEED_PHONES: Record<string, string> = {
  "admin@example.test": "0500000001",
  "facilitator@example.test": "0500000002",
  "member1@example.test": "0500000003",
  "member2@example.test": "0500000004",
};
export const SEED_PASSWORD = "goodlife123";

/** Local Supabase mail viewer (Mailpit) started by `supabase start`. */
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
type MailSummary = { ID: string; Created: string };

/** Waits for the newest email to `email` sent after `since`, and returns its 6-digit code. */
export async function latestEmailCode(email: string, since: Date): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    const { messages } = (await res.json()) as { messages: MailSummary[] };
    const fresh = messages.find((m) => new Date(m.Created) >= since);
    if (fresh) {
      const body = (await (await fetch(`${MAILPIT_URL}/api/v1/message/${fresh.ID}`)).json()) as { Text: string; HTML: string };
      const code = `${body.Text} ${body.HTML}`.match(/\b(\d{6})\b/)?.[1];
      if (code) return code;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No code arrived for ${email}`);
}

/** Signs in with the emailed code. */
export async function signInWithCode(page: Page, email: string) {
  await page.goto("/sign-in");
  const since = new Date(Date.now() - 1000);
  await page.getByLabel("البريد الإلكتروني أو رقم الجوال").fill(email);
  await page.getByRole("button", { name: "أرسل الرمز" }).click();
  await page.getByLabel("رمز الدخول").fill(await latestEmailCode(email, since));
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).not.toHaveURL(/\/sign-in/);
}

/** Signs in through the real UI with a password (seed accounts have one). Takes a seed account's email or a mobile. */
export async function signIn(page: Page, who: string, password = SEED_PASSWORD) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "الدخول بكلمة المرور" }).click();
  await page.getByLabel("البريد الإلكتروني أو رقم الجوال").fill(SEED_PHONES[who] ?? who);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
  await page.getByRole("button", { name: "دخول" }).click();
  // Each role lands on its own home: «يومك», «مجموعاتي», or the admin panel.
  await expect(page).not.toHaveURL(/\/sign-in/);
}

/** A mobile number no seed account uses. */
export const newPhone = () => `05${String(Date.now()).slice(-7)}${Math.floor(Math.random() * 10)}`;

/** Fills the sign-up form (Saudi Arabia preselected) and submits it. */
export async function fillSignUp(page: Page, { email, phone, name = "مشارك الاختبار" }: { email: string; phone: string; name?: string }) {
  await page.goto("/join");
  await page.getByLabel("الاسم الكامل").fill(name);
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("رقم الجوال").fill(phone);
  await page.getByRole("button", { name: "أنشئ حسابي" }).click();
}

/** Signs up as a brand-new member (default group), confirms the emailed code and stops on /welcome. Returns the email. */
export async function joinNewMember(page: Page, email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.test`) {
  const since = new Date(Date.now() - 1000);
  await fillSignUp(page, { email, phone: newPhone() });
  const code = await latestEmailCode(email, since);
  await page.getByLabel("رمز الدخول").fill(code);
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).toHaveURL("/welcome");
  return email;
}

/** Signs in in a fresh context with no `gl_ui` cookie, so only the account decides the version. */
export async function signInFresh(browser: import("@playwright/test").Browser, email: string) {
  const context = await browser.newContext({ locale: "ar", timezoneId: "Asia/Riyadh", storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await signIn(page, email);
  return { context, page };
}

/**
 * Adds an own habit through the 3-step flow (spec 004): first non-plan domain → «عادة من عندي» →
 * defaults (daily, any time). Lands on «يومك».
 */
export async function addOwnHabit(page: Page, name: string, { domain }: { domain?: string } = {}) {
  await page.goto("/habits/new");
  const domains = page.getByRole("radio");
  await (domain ? page.getByRole("radio", { name: new RegExp(domain) }) : domains.first()).click();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "عادة من عندي" }).click();
  await page.getByLabel("اسم العادة").fill(name);
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "حفظ العادة" }).click();
  await expect(page).toHaveURL("/");
}
