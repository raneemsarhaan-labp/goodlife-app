import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { signIn } from "./helpers/auth";

// quickstart.md scenario 8 and the facilitator part of scenario 7 (US6).
test("members encourage each other with preset phrases only, once a day", async ({ page }) => {
  await signIn(page, "member1@example.test");
  await page.goto("/community");
  await expect(page.getByText("مجموعتك: مجموعة النور")).toBeVisible();
  await expect(page.getByText("سارة الميسّرة")).toBeVisible();
  await checkA11y(page);

  const peer = page.getByRole("listitem").filter({ hasText: "مريم المشاركة" });
  await expect(peer.getByRole("textbox")).toHaveCount(0); // no free text anywhere
  const alreadySent = await peer.getByText("شجّعته اليوم").count();
  if (!alreadySent) {
    await peer.getByLabel("شجّع مريم المشاركة").selectOption({ label: "بارك الله في سعيك" });
    await peer.getByRole("button", { name: "أرسل" }).click();
    await expect(peer.getByRole("status")).toHaveText("وصلته كلمتك.");
  }
  await page.reload();
  await expect(page.getByRole("listitem").filter({ hasText: "مريم المشاركة" }).getByText("شجّعته اليوم")).toBeVisible();

  await page.context().clearCookies();
  await signIn(page, "member2@example.test");
  await page.goto("/community");
  await expect(page.getByText("«بارك الله في سعيك» — أحمد المشارك").first()).toBeVisible();
});

test("«مجموعاتي» lists led groups and the member group; facilitator schedules for their group", async ({ page }) => {
  await signIn(page, "facilitator@example.test");
  await page.goto("/groups");
  await expect(page.getByText("ميسّر").first()).toBeVisible();
  await checkA11y(page);
  await page.getByRole("link", { name: "افتح: مجموعة النور" }).click();

  const title = `جلسة المجموعة ${Date.now().toString().slice(-5)}`;
  await page.getByLabel("العنوان").fill(title);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel("يبدأ").fill(`${tomorrow}T20:00`);
  await expect(page.getByLabel("دفعة كاملة")).toHaveCount(0); // cohort-wide is admin-only
  await page.getByRole("button", { name: "احفظ النشاط" }).click();
  await expect(page.getByText(title).first()).toBeVisible();

  await page.context().clearCookies();
  await signIn(page, "member1@example.test");
  await expect(page.getByText(title)).toBeVisible();
});
