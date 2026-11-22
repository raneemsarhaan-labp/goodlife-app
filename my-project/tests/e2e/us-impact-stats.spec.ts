import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { signIn } from "./helpers/auth";

// Spec 006 (T008): «أثرك ← أنا» for the seeded member1 (ten days of history, two plan domains).
test("tiles, bars with values and table, plan vs others, life areas", async ({ page }) => {
  await signIn(page, "member1@example.test");
  await page.goto("/stats");
  await checkA11y(page);
  await expect(page.getByText("أيامٌ متتالية أنجزت فيها عادة")).toBeVisible();
  await expect(page.getByText("عادات نشطة")).toBeVisible();

  const bars = page.getByRole("list", { name: "التزامك مع الوقت" });
  await expect(bars.getByRole("listitem")).toHaveCount(7);
  await bars.getByRole("listitem").first().focus();
  await expect(bars.getByRole("listitem").first()).toHaveAccessibleName(/من/);
  await page.getByText("اعرض الأرقام جدولًا").click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(8);

  await expect(page.getByRole("heading", { name: "خطتي مقابل ما سواها" })).toBeVisible();

  const areas = page.getByRole("region", { name: "أين تعيش حياتك" });
  await expect(areas.getByRole("listitem")).toHaveCount(7);
  await areas.getByRole("button", { name: "الالتزام" }).click();
  await expect(areas.getByRole("button", { name: "الالتزام" })).toHaveAttribute("aria-pressed", "true");
  await checkA11y(page);

  await page.goto("/stats?period=journey");
  await expect(page.getByRole("list", { name: "التزامك مع الوقت" }).getByRole("listitem").first()).toBeVisible();
});
