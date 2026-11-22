import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { joinNewMember } from "./helpers/auth";

// Spec 003 US3 (T026): «اجعلها عادة» turns today's challenge into a habit. A fresh member keeps the
// seeded members' habits untouched.
test("own challenge → prefilled habit → on «يومك»; duplicate warning; cancel creates nothing", async ({ page }) => {
  await joinNewMember(page);
  await page.goto("/setup/look");
  await page.getByRole("button", { name: "تخطَّ الآن" }).click();

  const own = page.getByRole("region", { name: "تحدّي ذاتي" });
  await own.getByLabel("اكتب تحدّيًا لنفسك اليوم").fill("اشرب كوب ماء قبل أي مشروب آخر");
  await own.getByRole("button", { name: "احفظ التحدّي" }).click();
  await own.getByRole("link", { name: "اجعلها عادة" }).click();
  await expect(page).toHaveURL("/habits/new?from=own");
  await checkA11y(page);
  await expect(page.getByText("من تحدّي اليوم")).toBeVisible();
  // Spec 004: the flow opens at step 2 with the challenge as «عادة من عندي».
  await expect(page.getByLabel("اسم العادة")).toHaveValue("اشرب كوب ماء قبل أي مشروب آخر");
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "حفظ العادة" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "اشرب كوب ماء قبل أي مشروب آخر", exact: true })).toBeVisible();
  // The challenge is unchanged.
  await expect(own.getByText("اشرب كوب ماء قبل أي مشروب آخر")).toBeVisible();

  // Second time: it is already a habit.
  await own.getByRole("link", { name: "اجعلها عادة" }).click();
  await expect(page.getByText("لديك عادة بالاسم نفسه")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/");
  await expect(page.locator("[data-habit-id]")).toHaveCount(1);
});

test("journey challenge offers «اجعلها عادة» when present", async ({ page }) => {
  await joinNewMember(page);
  await page.goto("/");
  const journey = page.getByRole("region", { name: "تحدّي الرحلة" });
  test.skip((await journey.count()) === 0, "no journey challenge seeded for today");
  await journey.getByRole("link", { name: "اجعلها عادة" }).click();
  await expect(page).toHaveURL("/habits/new?from=journey");
  await expect(page.getByLabel("اسم العادة")).not.toHaveValue("");
});
