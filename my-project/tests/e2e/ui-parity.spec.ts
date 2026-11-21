import { expect, test } from "@playwright/test";
import { joinNewMember } from "./helpers/auth";

// Spec 002 US2 (T026, SC-003): the same day in each version stores the same state and stats.
// Runs in every Playwright project (one per version); each run uses a fresh member.
test("same actions → same «يومك» and stats in this version", async ({ page }) => {
  await joinNewMember(page);
  await page.goto("/setup/look");
  await page.getByRole("button", { name: "تخطَّ الآن" }).click();
  for (const name of ["قراءة", "مشي", "نوم مبكر"]) {
    await page.goto("/habits/new");
    await page.getByLabel("اسم العادة").fill(name);
    await page.getByRole("button", { name: "أضف العادة" }).click();
    await expect(page).toHaveURL("/");
  }
  await page.getByRole("button", { name: "قراءة", exact: true }).click();
  await page.getByRole("button", { name: "نوم مبكر", exact: true }).click();
  await expect(page.getByText("٢/٣", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "قراءة", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "مشي", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "نوم مبكر", exact: true })).toHaveAttribute("aria-pressed", "true");

  // Stats read the same stored rows: every habit is listed with its own completion.
  await page.goto("/stats");
  for (const name of ["قراءة", "مشي", "نوم مبكر"]) await expect(page.getByText(name).first()).toBeVisible();
});
