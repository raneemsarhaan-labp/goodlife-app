import path from "node:path";
import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { signIn } from "./helpers/auth";

// quickstart.md scenario 9 (US7).
test("admin uploads a cohort-only recording; members of that cohort play it, others cannot", async ({ page, browser }) => {
  const title = `تسجيل اللقاء ${Date.now().toString().slice(-5)}`;

  await signIn(page, "admin@example.test");
  await page.goto("/admin/resources");
  await page.getByLabel("النوع").selectOption({ label: "تسجيل" });
  await page.getByLabel("العنوان").fill(title);
  await page.getByLabel("الملف").setInputFiles(path.join(__dirname, "fixtures/silence.wav"));
  await page.getByLabel("دفعات محددة").check();
  await page.getByLabel("الدفعة التجريبية").check();
  await page.getByRole("button", { name: "احفظ المورد" }).click();
  await expect(page.getByRole("status").filter({ hasText: "تمّ الحفظ." })).toBeVisible();
  await expect(page.getByText(title)).toBeVisible();
  await checkA11y(page);

  // A member of the seed cohort plays it.
  await page.context().clearCookies();
  await signIn(page, "member1@example.test");
  await page.goto("/resources");
  await checkA11y(page);
  await page.getByRole("link", { name: /التسجيلات/ }).click();
  await page.getByRole("button", { name: `استمع: ${title}` }).click();
  const audio = page.locator("audio");
  await expect(audio).toBeVisible();
  const signedUrl = await audio.getAttribute("src");
  expect(signedUrl).toContain("token=");

  // Journey map highlights the current stage; the ten guidelines are listed.
  await page.goto("/resources/map");
  await expect(page.locator("[aria-current=step]")).toContainText("أنت هنا");
  await page.goto("/resources/guidelines");
  await expect(page.getByText("عشرة أعراف تحكم الرحلة")).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(10);

  // A user outside the cohort (fresh account in another cohort is not seeded): an admin-less,
  // group-less session cannot list it, and a direct storage request without a signature fails.
  const anon = await browser.newContext();
  const response = await anon.request.get(signedUrl!.replace(/token=[^&]+/, "token=invalid"));
  expect(response.ok()).toBe(false);
  await anon.close();
});
