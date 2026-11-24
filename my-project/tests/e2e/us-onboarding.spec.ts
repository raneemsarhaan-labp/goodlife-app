import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { joinNewMember } from "./helpers/auth";

// «رحلة البداية»: the setup after sign-up fills the plan and the first habits; «خطوات البداية» on
// «يومك» ticks each step and links to the rest.
test.use({ storageState: { cookies: [], origins: [] } });

test("a new member sets up the journey and sees the first steps on «يومك»", async ({ page }) => {
  await joinNewMember(page);
  await page.getByRole("link", { name: "ابدأ رحلتك" }).click();

  await expect(page).toHaveURL("/setup/state");
  await checkA11y(page);
  await page.getByLabel("واقعي الآن").fill("أبدأ يومي متأخرًا ومتعبًا");
  await page.getByRole("button", { name: "التالي" }).click();

  await expect(page).toHaveURL("/setup/desired");
  await page.getByLabel("حالي المنشود").fill("أستيقظ مبكرًا ولي وقت لنفسي");
  await page.getByRole("button", { name: "التالي" }).click();

  await expect(page).toHaveURL("/setup/domains");
  await checkA11y(page);
  await page.getByLabel("النفس والبدن").check();
  await page.getByRole("button", { name: "التالي" }).click();

  await expect(page).toHaveURL("/setup/habits");
  await checkA11y(page);
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "التالي" }).click();

  await expect(page).toHaveURL("/setup/look");
  await page.getByRole("button", { name: "تخطَّ الآن" }).click();
  await expect(page).toHaveURL("/");

  const card = page.getByRole("region", { name: "خطوات البداية" });
  await expect(card.getByText("أنجزت ٥ من ٧")).toBeVisible();
  await expect(page.getByText("أستيقظ مبكرًا ولي وقت لنفسي")).toBeVisible();
  await card.getByRole("link", { name: /ابدأ يومك الأول بنيّة/ }).click();
  await expect(page).toHaveURL("/day/start");

  await page.goto("/");
  await card.getByRole("button", { name: "أخفِ خطوات البداية" }).click();
  await expect(card).toHaveCount(0);
});
