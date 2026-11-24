import { expect, type Page } from "@playwright/test";

/** Seed accounts (supabase/seed.sql): mobile numbers; every seed password is goodlife123. */
const SEED_PHONES: Record<string, string> = {
  "admin@example.test": "0500000001",
  "facilitator@example.test": "0500000002",
  "member1@example.test": "0500000003",
  "member2@example.test": "0500000004",
};
export const SEED_PASSWORD = "goodlife123";

/** Signs in through the real UI (mobile + password). Takes a seed account's name or a mobile number. */
export async function signIn(page: Page, who: string, password = SEED_PASSWORD) {
  await page.goto("/sign-in");
  await page.getByLabel("رقم الجوال").fill(SEED_PHONES[who] ?? who);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
  await page.getByRole("button", { name: "دخول" }).click();
  // Each role lands on its own home: «يومك», «مجموعاتي», or the admin panel.
  await expect(page).not.toHaveURL(/\/sign-in/);
}

/** A mobile number no seed account uses. */
export const newPhone = () => `05${String(Date.now()).slice(-7)}${Math.floor(Math.random() * 10)}`;

/** Signs up as a brand-new member (joins the default group) and stops on /welcome. Returns the mobile. */
export async function joinNewMember(page: Page, phone = newPhone()) {
  await page.goto("/join");
  await page.getByLabel("الاسم الكامل").fill("مشارك الاختبار");
  await page.getByLabel("رقم الجوال").fill(phone);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(SEED_PASSWORD);
  await page.getByLabel("أعد كتابة كلمة المرور").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "أنشئ حسابي" }).click();
  await expect(page).toHaveURL("/welcome");
  return phone;
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
