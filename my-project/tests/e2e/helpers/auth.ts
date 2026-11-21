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
  await expect(page).toHaveURL("/");
}
