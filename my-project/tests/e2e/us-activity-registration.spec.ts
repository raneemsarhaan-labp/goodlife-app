import { expect, test, type Page } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { joinNewMember, signIn } from "./helpers/auth";

// Spec 003 US2 (T017). Seed: «نشاط قراءة: أمراض القلوب», online, 4 sessions, 2 places, for group
// «مجموعة النور» (member1, member2, and anyone joining with TAYBAH26).
const ACTIVITY = "00000000-0000-4000-8000-0000000000e2";
const TITLE = "نشاط قراءة: أمراض القلوب";

async function openFromToday(page: Page) {
  await page.goto("/");
  await page.getByText(TITLE).first().click();
  await expect(page).toHaveURL(`/activities/${ACTIVITY}`);
}

test("register, see the link and the «يومك» card, fill the places, free one", async ({ page, browser }) => {
  test.setTimeout(180_000);
  await signIn(page, "member1@example.test");
  await openFromToday(page);
  await checkA11y(page);
  await expect(page.getByText("يظهر رابط اللقاء بعد التسجيل.")).toBeVisible();
  await page.getByRole("button", { name: "سجّلني" }).click();
  await expect(page.getByRole("status").filter({ hasText: "سجّلتَ في هذا النشاط." })).toBeVisible();
  await expect(page.getByRole("link", { name: "رابط اللقاء" })).toHaveAttribute("href", "https://meet.example.test/qulub");

  await page.goto("/");
  const card = page.getByRole("region", { name: new RegExp(TITLE) });
  await expect(card).toContainText("نشاط سجّلت فيه · أونلاين");
  await expect(card).toContainText("اللقاء القادم");
  await card.getByRole("button", { name: "أخفِ البطاقة اليوم" }).click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("region", { name: new RegExp(TITLE) })).toHaveCount(0);

  // Second member takes the last place; a third finds it full.
  const second = await browser.newContext({ storageState: { cookies: [], origins: [] }, locale: "ar", timezoneId: "Asia/Riyadh" });
  const p2 = await second.newPage();
  await signIn(p2, "member2@example.test");
  await p2.goto(`/activities/${ACTIVITY}`);
  await p2.getByRole("button", { name: "سجّلني" }).click();
  await expect(p2.getByRole("status").filter({ hasText: "سجّلتَ في هذا النشاط." })).toBeVisible();

  const third = await browser.newContext({ storageState: { cookies: [], origins: [] }, locale: "ar", timezoneId: "Asia/Riyadh" });
  const p3 = await third.newPage();
  await joinNewMember(p3);
  await p3.goto(`/activities/${ACTIVITY}`);
  await expect(p3.getByText("اكتمل العدد")).toBeVisible();
  await expect(p3.getByRole("button", { name: "سجّلني" })).toHaveCount(0);

  // A cancellation frees the place.
  await p2.getByRole("button", { name: "ألغِ تسجيلي" }).click();
  await expect(p2.getByRole("status").filter({ hasText: "أُلغي تسجيلك." })).toBeVisible();
  await p3.reload();
  await p3.getByRole("button", { name: "سجّلني" }).click();
  await expect(p3.getByRole("status").filter({ hasText: "سجّلتَ في هذا النشاط." })).toBeVisible();

  // Organizers: the admin sees everyone; the facilitator sees only members of their groups.
  const admin = await browser.newContext({ storageState: { cookies: [], origins: [] }, locale: "ar", timezoneId: "Asia/Riyadh" });
  const pa = await admin.newPage();
  await signIn(pa, "admin@example.test");
  await pa.goto(`/admin/activities/${ACTIVITY}`);
  await checkA11y(pa);
  await expect(pa.getByRole("heading", { name: /المسجّلون \(٢\)/ })).toBeVisible();

  const fac = await browser.newContext({ storageState: { cookies: [], origins: [] }, locale: "ar", timezoneId: "Asia/Riyadh" });
  const pf = await fac.newPage();
  await signIn(pf, "facilitator@example.test");
  await pf.goto(`/activities/${ACTIVITY}`);
  await expect(pf.getByRole("heading", { name: /المسجّلون من مجموعاتك/ })).toBeVisible();

  // Clean up for other specs: member1 and the new member cancel.
  await page.goto(`/activities/${ACTIVITY}`);
  await page.getByRole("button", { name: "ألغِ تسجيلي" }).click();
  await p3.getByRole("button", { name: "ألغِ تسجيلي" }).click();
  for (const c of [second, third, admin, fac]) await c.close();
});

test("an organizer adds a multi-session online activity with registration", async ({ page }) => {
  await signIn(page, "admin@example.test");
  await page.goto("/admin/activities");
  await page.getByLabel("العنوان").fill("حلقة اختبار");
  await page.getByLabel("يبدأ").first().fill("2027-01-05T18:00");
  await page.getByRole("button", { name: "أضف لقاءً" }).click();
  await page.getByLabel("يبدأ").nth(1).fill("2027-01-12T18:00");
  await page.getByLabel("أونلاين").check();
  await page.getByLabel(/رابط اللقاء/).fill("https://meet.example.test/test");
  await page.getByLabel("يحتاج إلى تسجيل").check();
  await page.getByLabel(/عدد المقاعد/).fill("10");
  await page.getByLabel("دفعة كاملة").check();
  await page.getByRole("button", { name: "احفظ النشاط" }).click();
  await expect(page.getByRole("status").filter({ hasText: "تمّ الحفظ." })).toBeVisible();
  await expect(page.getByText("حلقة اختبار").first()).toBeVisible();
});
