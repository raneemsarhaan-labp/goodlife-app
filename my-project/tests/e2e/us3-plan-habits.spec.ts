import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { signIn } from "./helpers/auth";

// quickstart.md scenario 4 (US3). Seeded member1 has four habits and a written current state.
test("plan: current state, focus areas, linked habits, reorder, archive and restore", async ({ page }) => {
  await signIn(page, "member1@example.test");
  await page.goto("/plan");
  await checkA11y(page);

  // Current state.
  const state = page.getByRole("textbox", { name: "واقعي الآن" });
  await state.fill("أبدأ هذه الرحلة وأنا أريد يومًا أهدأ.");
  await page.getByRole("region", { name: "واقعي الآن" }).getByRole("button", { name: "احفظ" }).click();
  await expect(page.getByRole("region", { name: "واقعي الآن" }).getByRole("status")).toHaveText("تمّ الحفظ.");

  // Three focus areas.
  const areas = page.getByRole("region", { name: "مجالات العمل لعامك" });
  for (const title of ["الصحة", "الأسرة", "العلم"]) {
    await areas.getByLabel("اسم المجال").last().fill(title);
    await areas.getByRole("button", { name: "أضف مجالًا" }).click();
    await expect(areas.getByText(title, { exact: true }).first()).toBeVisible();
  }

  // Link a habit to «الصحة».
  const byArea = page.getByRole("region", { name: "عاداتك حسب المجال" });
  await byArea.getByRole("link", { name: "تعديل: مشي عشرين دقيقة" }).click();
  await page.getByLabel("المجال").selectOption({ label: "الصحة" });
  await page.getByRole("button", { name: "احفظ" }).click();
  await expect(page.getByRole("status")).toHaveText("تمّ الحفظ.");
  await page.goto("/plan");
  await expect(page.getByRole("region", { name: "الصحة" }).getByText("مشي عشرين دقيقة")).toBeVisible();

  // Reorder: move the second habit up; «يومك» follows.
  await page.getByRole("button", { name: "تحريك «مشي عشرين دقيقة» للأعلى" }).click();
  await expect(page.getByRole("status").filter({ hasText: "حُفظ الترتيب." })).toBeVisible();
  await page.goto("/");
  await expect(page.locator("[data-habit-id] button[aria-pressed]").first()).toHaveAccessibleName("مشي عشرين دقيقة");

  // Archive → leaves «يومك», appears in archived; restore brings it back.
  await page.goto("/plan");
  await page.getByRole("link", { name: "تعديل: دقائق من الهدوء والتأمل" }).click();
  await page.getByRole("button", { name: "أرشف العادة" }).click();
  await expect(page).toHaveURL("/plan");
  await page.goto("/");
  await expect(page.getByRole("button", { name: "دقائق من الهدوء والتأمل", exact: true })).toHaveCount(0);
  await page.goto("/account/archived-habits");
  await checkA11y(page);
  await page.getByRole("listitem").filter({ hasText: "دقائق من الهدوء والتأمل" }).getByRole("button", { name: "استعادة" }).click();
  await page.goto("/");
  await expect(page.getByRole("button", { name: "دقائق من الهدوء والتأمل", exact: true })).toBeVisible();
});
