import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { signIn } from "./helpers/auth";

// quickstart.md scenarios 6 and 7 (US5). Exact figures are covered by supabase/tests/stats.test.sql
// against fixtures/stats_expected.json; here we check what each role sees.
test("member stats show rates, streaks, and challenges by period", async ({ page }) => {
  await signIn(page, "member1@example.test");
  await page.goto("/stats");
  await expect(page.getByRole("heading", { name: "الالتزام بالعادات" })).toBeVisible();
  await expect(page.getByText(/المتتالية الحالية/).first()).toBeVisible();
  await expect(page.getByText(/تحدّيات الرحلة:/)).toBeVisible();
  await expect(page.getByText(/تحدّياتك الذاتية:/)).toBeVisible();
  await checkA11y(page);
  for (const period of ["هذا الشهر", "الرحلة كلها"]) {
    await page.getByRole("link", { name: period }).click();
    await expect(page.getByRole("link", { name: period })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "عاداتك" })).toBeVisible();
  }
});

test("facilitator sees group aggregates and activity signals only", async ({ page }) => {
  await signIn(page, "facilitator@example.test");
  await page.goto("/groups");
  await page.getByRole("link", { name: /مجموعة النور/ }).click();
  await expect(page.getByText(/متوسط الالتزام/)).toBeVisible();
  await expect(page.getByText("أحمد المشارك")).toBeVisible();
  await checkA11y(page);
  // No personal content: habit names, intentions, plan text never appear.
  for (const privateText of ["قراءة عشر صفحات", "مشي عشرين دقيقة", "أبدأ هذه الرحلة وأنا أريد يومًا أهدأ"]) {
    await expect(page.getByText(privateText)).toHaveCount(0);
  }
  // Another group's page is not available.
  await page.goto("/groups/00000000-0000-4000-8000-0000000000a2");
  await expect(page.getByRole("heading", { name: "هذه الصفحة غير متاحة" })).toBeVisible();
});
