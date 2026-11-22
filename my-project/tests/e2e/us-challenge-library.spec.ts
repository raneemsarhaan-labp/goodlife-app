import { expect, test } from "@playwright/test";
import { joinNewMember } from "./helpers/auth";

// Spec 005 US2 (T011). The seed has journey challenges for the first days of the cohort; on a day
// without one, «تحدّي اليوم» comes from the library. A fresh member checks the variant shown today.
test("«تحدّي اليوم» from the library: stable, ↻ changes it, done counts", async ({ page }) => {
  await joinNewMember(page);
  await page.goto("/");
  const slot = page.getByRole("region", { name: /تحدّي اليوم|تحدّي الرحلة/ });
  test.skip((await slot.getByText("تحدّي الرحلة").count()) > 0, "today has a program challenge in the seed");
  const title = await slot.locator("p.text-lg").textContent();
  await page.reload();
  await expect(slot.locator("p.text-lg")).toHaveText(title!);
  await slot.getByRole("button", { name: "تحدٍّ آخر" }).click();
  await expect(slot.locator("p.text-lg")).not.toHaveText(title!);
  await slot.getByRole("button", { name: "لم أنجزه بعد" }).click();
  await expect(slot.getByRole("button", { pressed: true })).toBeVisible();
  await expect(slot.getByRole("button", { name: "تحدٍّ آخر" })).toHaveCount(0);
});
