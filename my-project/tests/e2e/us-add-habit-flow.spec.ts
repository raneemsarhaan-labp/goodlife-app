import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { joinNewMember } from "./helpers/auth";

// Spec 004 US1–US2 (T012, T015): the 3-step add flow, plan domains, repeat days on «يومك», the week.
const WEEKDAYS_AR = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]; // visible day labels

test("suggestion → customise → «يومك» group; plan-domain cap; unscheduled day hides the habit", async ({ page }) => {
  test.setTimeout(120_000);
  await joinNewMember(page);
  await page.goto("/setup/look");
  await page.getByRole("button", { name: "تخطَّ الآن" }).click();

  // Step 1: no plan domains yet; add three, the fourth is refused.
  await page.goto("/habits/new");
  await checkA11y(page);
  await expect(page.getByText("لم تضف مجالات إلى خطتك بعد")).toBeVisible();
  for (const name of ["الصلة بالله", "النفس والبدن", "العلاقات القريبة"]) {
    await page.getByRole("button", { name: `أضف «${name}» إلى خطتك` }).click();
    await expect(page.getByRole("button", { name: `أخرج «${name}» من خطتك` })).toBeVisible();
  }
  await page.getByRole("button", { name: "أضف «العمل والرزق» إلى خطتك" }).click();
  await expect(page.getByRole("alert")).toContainText("خطتك تضمّ ثلاثة مجالات");

  // Step 2: a suggestion from «النفس والبدن».
  await page.getByRole("radio", { name: /النفس والبدن/ }).click();
  await page.getByRole("button", { name: "التالي" }).click();
  await checkA11y(page);
  await page.getByRole("radio", { name: /^مشي/ }).click();
  await page.getByRole("button", { name: "التالي" }).click();

  // Step 3: evening, every day except today.
  await checkA11y(page);
  await expect(page.getByLabel(/مقدار يحدّد الفعل/)).toHaveValue("٢٠ دقيقة");
  await page.getByText("المساء", { exact: true }).click();
  const todayName = WEEKDAYS_AR[new Date().getDay()]!;
  await page.getByRole("button", { name: todayName, exact: true }).click();
  await expect(page.getByRole("button", { name: todayName, exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "حفظ العادة" }).click();
  await expect(page).toHaveURL("/");
  // Not scheduled today → not on «يومك».
  await expect(page.getByRole("button", { name: "مشي", exact: true })).toHaveCount(0);

  // «خطتي» lists it under its plan domain.
  await page.goto("/plan");
  await expect(page.getByRole("region", { name: "النفس والبدن" }).getByText("مشي")).toBeVisible();
});

test("own habit, time-of-day group, week circles and «سجّل اليوم»", async ({ page }) => {
  await joinNewMember(page);
  await page.goto("/habits/new");
  await page.getByRole("radio", { name: /العلم والتعلّم/ }).click();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "عادة من عندي" }).click();
  await page.getByLabel("اسم العادة").fill("قراءة صباحية");
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByText("الصباح", { exact: true }).click();
  await page.getByRole("button", { name: "حفظ العادة" }).click();
  await expect(page).toHaveURL("/");

  await expect(page.getByRole("region", { name: "الصباح" }).getByRole("button", { name: "قراءة صباحية", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "تفاصيل العادات" }).click();
  const week = page.getByRole("list", { name: "هذا الأسبوع" });
  await expect(week.getByRole("listitem")).toHaveCount(7);
  await expect(week.locator("[aria-current=date]")).toHaveCount(1);
  await page.getByRole("button", { name: "سجّل اليوم" }).click();
  await expect(page.getByRole("button", { name: "قراءة صباحية", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("١/٧ أيام").first()).toBeVisible();
});

test("«خطتي» edit: change repeat days", async ({ page }) => {
  await joinNewMember(page);
  await page.goto("/habits/new");
  await page.getByRole("radio").first().click();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "عادة من عندي" }).click();
  await page.getByLabel("اسم العادة").fill("عادة للتعديل");
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "حفظ العادة" }).click();
  await expect(page.getByRole("button", { name: "عادة للتعديل", exact: true })).toBeVisible();

  await page.goto("/plan");
  await page.getByRole("link", { name: "تعديل: عادة للتعديل" }).click();
  await checkA11y(page);
  await page.getByRole("button", { name: WEEKDAYS_AR[new Date().getDay()]!, exact: true }).click();
  await page.getByRole("button", { name: "احفظ" }).click();
  await expect(page.getByRole("status").filter({ hasText: "تمّ الحفظ." })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("button", { name: "عادة للتعديل", exact: true })).toHaveCount(0);
});
