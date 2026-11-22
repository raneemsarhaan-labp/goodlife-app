import { expect, type Page } from "@playwright/test";

/** Local Supabase mail viewer (Mailpit) started by `supabase start`. */
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

type MailSummary = { ID: string; To: { Address: string }[]; Created: string };

/** Waits for the newest sign-in email to `email` sent after `since`, and returns its 6-digit code. */
export async function latestSignInCode(email: string, since: Date): Promise<string> {
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
  throw new Error(`No sign-in code arrived for ${email}`);
}

/** Signs in through the real UI (email → 6-digit code). */
export async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  const since = new Date(Date.now() - 1000);
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByRole("button", { name: "أرسل الرمز" }).click();
  const code = await latestSignInCode(email, since);
  await page.getByLabel("رمز الدخول").fill(code);
  await page.getByRole("button", { name: "دخول" }).click();
  // Each role lands on its own home: «يومك», «مجموعاتي», or the admin panel.
  await expect(page).not.toHaveURL(/\/sign-in/);
}

/** Joins with the seeded invitation code as a brand-new member and stops on /welcome. */
export async function joinNewMember(page: Page, email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.test`) {
  await page.goto("/join");
  await page.getByLabel("رمز الدعوة").fill("taybah26");
  await page.getByRole("button", { name: "تحقّق من الرمز" }).click();
  await expect(page).toHaveURL("/join/profile");
  await page.getByLabel("الاسم الكامل").fill("مشارك الاختبار");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  // The membership is created only after the code emailed to that address is entered.
  const since = new Date(Date.now() - 1000);
  await page.getByRole("button", { name: "أنشئ حسابي" }).click();
  const code = await latestSignInCode(email, since);
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
