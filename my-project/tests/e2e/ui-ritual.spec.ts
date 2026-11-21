import { expect, test } from "@playwright/test";
import { joinNewMember, signInFresh } from "./helpers/auth";

// Spec 002 US4 (T045): the opening quote card — once a day, in «رحلة يومي» and «زجاج كامل» only.
test.use({ storageState: { cookies: [], origins: [] } });

async function chooseAndOpenToday(page: import("@playwright/test").Page, version: string) {
  await page.goto("/setup/look");
  await page.getByText(version, { exact: true }).click();
  await page.getByRole("button", { name: "اعتمد هذا الشكل" }).click();
  await expect(page).toHaveURL("/");
}

for (const [version, shows] of [["رحلة يومي", true], ["زجاج كامل", true], ["زجاجي", false]] as const) {
  test(`«${version}»: quote card ${shows ? "shows once" : "does not show"}`, async ({ page, browser }) => {
    const email = await joinNewMember(page);
    await chooseAndOpenToday(page, version);
    const card = page.getByRole("dialog");
    if (!shows) {
      await expect(page.locator("[data-habit-id], [aria-busy=true]").first()).toBeAttached();
      await expect(card).toHaveCount(0);
      return;
    }
    await expect(card).toBeVisible();
    await expect(card.getByText("من اقتباسات الحياة الطيبة")).toBeVisible();
    await card.getByRole("button", { name: "ابدأ يومي" }).click();
    await expect(page).toHaveURL("/day/start");

    // Not again today — on this device or another.
    await page.goto("/");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const other = await signInFresh(browser, email);
    await expect(other.page.getByRole("dialog")).toHaveCount(0);
    await other.context.close();
  });
}

test("the ritual can be turned off", async ({ page }) => {
  await joinNewMember(page);
  await page.goto("/account/appearance");
  await page.getByLabel(/بطاقة الاقتباس/).uncheck();
  await page.getByRole("button", { name: "احفظ" }).click();
  await expect(page.getByRole("status").filter({ hasText: "تمّ تطبيق الشكل." })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
