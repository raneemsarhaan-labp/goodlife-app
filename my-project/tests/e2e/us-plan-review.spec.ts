import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { joinNewMember, signIn } from "./helpers/auth";

// Spec 005 US3 (T014). Every Playwright project (one per visual version) shares the database, so the
// seeded member is only read here; a fresh member completes a review.
test("seeded member1: «حان موعد مراجعتك» shows on «يومك» and «خطتي»", async ({ page }) => {
  await signIn(page, "member1@example.test");
  await expect(page.getByRole("region", { name: "حان موعد مراجعتك" })).toBeVisible();
  await page.goto("/plan");
  await expect(page.getByRole("region", { name: "حان موعد مراجعتك" }).getByRole("link", { name: "ابدأ المراجعة" })).toHaveAttribute("href", "/plan/review");
});

test("the review: texts, domains and the next review date on one page", async ({ page }) => {
  await joinNewMember(page);
  await page.goto("/plan/review");
  await checkA11y(page);
  await page.getByLabel("هويّتي").fill("أنا أتعلّم كل يوم.");
  await page.getByRole("region", { name: "هويّتي" }).getByRole("button", { name: "احفظ" }).click();
  await expect(page.getByRole("region", { name: "هويّتي" }).getByRole("status")).toHaveText("تمّ الحفظ.");
  await expect(page.getByRole("heading", { name: /مجالات عملي هذه السنة/ })).toBeVisible();
  await page.getByLabel("تاريخٌ آخر").check();
  await checkA11y(page);
  const inTwoWeeks = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel("اختر التاريخ").fill(inTwoWeeks);
  await page.getByRole("button", { name: "حفظ", exact: true }).click();
  await expect(page).toHaveURL("/plan");
  await expect(page.getByRole("region", { name: "حان موعد مراجعتك" })).toHaveCount(0);
});
