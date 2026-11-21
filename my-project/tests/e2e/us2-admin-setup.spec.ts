import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { signIn } from "./helpers/auth";

// quickstart.md scenario 3 (US2). Requires `supabase start` + seed (admin@example.test).
test("admin sets up a cohort, groups, facilitator, codes, and an activity", async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const cohortName = `دفعة الاختبار ${suffix}`;

  await signIn(page, "admin@example.test");
  await page.goto("/admin");
  await checkA11y(page);

  // Cohort with a start date.
  await page.goto("/admin/cohorts");
  await page.getByLabel("اسم الدفعة").fill(cohortName);
  await page.getByLabel("تاريخ البداية").fill(new Date().toISOString().slice(0, 10));
  await page.getByRole("button", { name: "أنشئ الدفعة" }).click();
  await expect(page.getByRole("heading", { name: cohortName })).toBeVisible();
  await checkA11y(page);
  await page.getByRole("listitem").filter({ hasText: cohortName }).getByRole("link", { name: "إدارة الدفعة" }).click();

  // Two groups.
  for (const name of ["الفجر", "الضحى"]) {
    await page.getByLabel("اسم المجموعة").fill(name);
    await page.getByRole("button", { name: "أضف المجموعة" }).click();
    await expect(page.getByRole("heading", { name })).toBeVisible();
  }
  await checkA11y(page);

  // Assign the seeded facilitator to the first group.
  const fajr = page.locator("section", { has: page.getByRole("heading", { name: "الفجر" }) }).first();
  await fajr.getByLabel("عيّن ميسّرًا").fill("facilitator@example.test");
  await fajr.getByRole("button", { name: "عيّن" }).click();
  await expect(fajr.getByText("سارة الميسّرة")).toBeVisible();

  // Five codes for the group.
  await page.goto("/admin/invitations");
  await page.getByLabel("المجموعة").selectOption({ label: `${cohortName} — الفجر` });
  await page.getByLabel("عدد الرموز").fill("5");
  await page.getByRole("button", { name: "أنشئ الرموز" }).click();
  const generated = page.getByRole("status").filter({ hasText: "الرموز الجديدة" });
  await expect(generated).toBeVisible();
  const codes = (await generated.locator("p[dir=ltr]").textContent())?.trim().split(/\s+/) ?? [];
  expect(codes).toHaveLength(5);
  for (const code of codes) expect(code).toMatch(/^[A-HJKMNP-Z2-9]{8}$/);
  await checkA11y(page);

  // Revoke one code.
  const row = page.getByRole("row").filter({ hasText: codes[0]! });
  await row.getByRole("button", { name: "إلغاء" }).click();
  await expect(page.getByRole("row").filter({ hasText: codes[0]! })).toContainText("ملغى");

  // Cohort-wide activity in the seed cohort → member sees it on «يومك».
  await page.goto("/admin/activities");
  const title = `لقاء اختبار ${suffix}`;
  await page.getByLabel("العنوان").fill(title);
  const inTwoDays = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel("يبدأ").fill(`${inTwoDays}T19:00`);
  await page.getByLabel("دفعة كاملة").check();
  await page.getByLabel("اختر الدفعة").selectOption({ label: "الدفعة التجريبية" });
  await page.getByRole("button", { name: "احفظ النشاط" }).click();
  await expect(page.getByText(title).first()).toBeVisible();
  await checkA11y(page);

  await page.context().clearCookies();
  await signIn(page, "member2@example.test");
  await expect(page.getByText(title)).toBeVisible();
});
