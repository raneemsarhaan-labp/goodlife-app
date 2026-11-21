import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { joinNewMember, signInFresh } from "./helpers/auth";

// Spec 002 US3 (T043): change the look any time, without signing out or losing typed text.
test.use({ storageState: { cookies: [], origins: [] } });

test("switching in «المظهر» applies at once and follows the account", async ({ page, context, browser }) => {
  const email = await joinNewMember(page);
  await page.goto("/setup/look");
  await page.getByRole("button", { name: "تخطَّ الآن" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-ui", "journey");

  // Unsaved text in another tab survives the switch.
  const draft = await context.newPage();
  await draft.goto("/day/start");
  const intention = draft.getByRole("textbox").first();
  await intention.fill("نية لم تُحفظ بعد");

  await page.goto("/more");
  await page.getByRole("link", { name: "المظهر" }).click();
  await expect(page).toHaveURL("/account/appearance");
  await checkA11y(page);
  await page.getByText("زجاجي", { exact: true }).click();
  await page.getByRole("button", { name: "احفظ" }).click();
  await expect(page.getByRole("status").filter({ hasText: "تمّ تطبيق الشكل." })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-ui", "glass");
  await expect(intention).toHaveValue("نية لم تُحفظ بعد");

  // Reduce transparency is a separate comfort setting.
  await page.getByLabel(/تقليل الشفافية/).check();
  await page.getByRole("button", { name: "احفظ" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-reduce-transparency", "true");

  const other = await signInFresh(browser, email);
  await expect(other.page.locator("html")).toHaveAttribute("data-ui", "glass");
  await other.context.close();
});
