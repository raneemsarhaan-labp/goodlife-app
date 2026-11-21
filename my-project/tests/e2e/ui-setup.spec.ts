import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { joinNewMember, signInFresh } from "./helpers/auth";

// Spec 002 US1 (T021): choose a version during setup; it follows the account to another device.
test.use({ storageState: { cookies: [], origins: [] } });

test("choose «زجاج كامل» on setup; another device signs in to the same look", async ({ page, browser }) => {
  const email = await joinNewMember(page);
  await page.getByRole("link", { name: "ابدأ رحلتك" }).click();
  await expect(page).toHaveURL("/setup/look");
  await checkA11y(page);
  await expect(page.getByRole("radio")).toHaveCount(3);
  await page.getByText("زجاج كامل", { exact: true }).click();
  await page.getByRole("button", { name: "اعتمد هذا الشكل" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator("html")).toHaveAttribute("data-ui", "full-glass");
  // No invitation card once a choice is made.
  await expect(page.getByRole("region", { name: "اختر شكل تطبيقك" })).toHaveCount(0);

  const other = await signInFresh(browser, email);
  await expect(other.page.locator("html")).toHaveAttribute("data-ui", "full-glass");
  await other.context.close();
});

test("skipping keeps «رحلة يومي»", async ({ page }) => {
  await joinNewMember(page);
  await page.goto("/setup/look");
  await page.getByRole("button", { name: "تخطَّ الآن" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator("html")).toHaveAttribute("data-ui", "journey");
  await expect(page.getByRole("region", { name: "اختر شكل تطبيقك" })).toHaveCount(0);
});
