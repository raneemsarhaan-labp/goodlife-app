import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { latestSignInCode } from "./helpers/auth";

// quickstart.md scenario 1 (US1). Requires `supabase start` + `supabase db reset` (seed).
test("join with a code and live a full day on «يومك»", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.test`;

  // Join: code → personal data → 6-digit code → welcome.
  await page.goto("/join");
  await checkA11y(page);
  await page.getByLabel("رمز الدعوة").fill("taybah26");
  await page.getByRole("button", { name: "تحقّق من الرمز" }).click();
  await expect(page).toHaveURL("/join/profile");
  await expect(page.getByText("مجموعة النور")).toBeVisible();
  await checkA11y(page);

  await page.getByLabel("الاسم الكامل").fill("مشارك الاختبار");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  const since = new Date(Date.now() - 1000);
  await page.getByRole("button", { name: "أنشئ حسابي" }).click();
  const code = await latestSignInCode(email, since);
  await page.getByLabel("رمز الدخول").fill(code);
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).toHaveURL("/welcome");
  await checkA11y(page);
  await page.getByRole("link", { name: "ابدأ رحلتك" }).click();

  // «يومك»: journey day 12 (seed cohort started 11 days ago), no habits yet.
  await expect(page.getByText("اليوم ١٢ من رحلتك")).toBeVisible();
  await checkA11y(page);
  for (const name of ["قراءة", "مشي", "نوم مبكر"]) {
    await page.goto("/habits/new");
    await page.getByLabel("اسم العادة").fill(name);
    await page.getByRole("button", { name: "أضف العادة" }).click();
    await expect(page).toHaveURL("/");
  }

  // Check two habits → ٢/٣.
  await page.getByRole("checkbox", { name: "قراءة" }).check();
  await page.getByRole("checkbox", { name: "مشي" }).check();
  await expect(page.getByText("أنجزت ٢/٣")).toBeVisible();
  await page.reload();
  await expect(page.getByText("أنجزت ٢/٣")).toBeVisible();

  // «ابدأ يومي»: intention.
  await page.getByRole("link", { name: /ابدأ يومي/ }).click();
  await page.getByLabel("نيّتي اليوم").fill("أن أكون حاضرًا مع أهلي");
  await page.getByRole("button", { name: "ابدأ" }).click();
  await expect(page.getByText("أن أكون حاضرًا مع أهلي")).toBeVisible();

  // Journey challenge and own challenge are labelled and styled differently.
  const journey = page.getByRole("region", { name: "تحدّي الرحلة" });
  const own = page.getByRole("region", { name: "تحدّي ذاتي" });
  await expect(journey).toBeVisible();
  await own.getByLabel("اكتب تحدّيًا لنفسك اليوم").fill("أمشي ربع ساعة بعد العصر");
  await own.getByRole("button", { name: "احفظ التحدّي" }).click();
  await expect(own.getByText("أمشي ربع ساعة بعد العصر")).toBeVisible();
  expect(await journey.evaluate((el) => getComputedStyle(el).borderStyle)).toBe("solid");
  expect(await own.evaluate((el) => getComputedStyle(el).borderStyle)).toBe("dashed");
  await journey.getByRole("button", { name: "لم أنجزه بعد" }).click();
  await own.getByRole("button", { name: "لم أنجزه بعد" }).click();
  await expect(journey.getByRole("button", { pressed: true })).toBeVisible();
  await expect(own.getByRole("button", { pressed: true })).toBeVisible();

  // Yesterday: late logging changes yesterday only.
  await page.getByRole("link", { name: "أمس" }).click();
  await expect(page.getByText("أنجزت ٠/٣")).toBeVisible();
  await page.getByRole("checkbox", { name: "قراءة" }).check();
  await expect(page.getByText("أنجزت ١/٣")).toBeVisible();
  await page.getByRole("link", { name: "اليوم", exact: true }).click();
  await expect(page.getByText("أنجزت ٢/٣")).toBeVisible();

  // «ختام اليوم».
  await page.getByRole("link", { name: "ختام اليوم" }).click();
  await expect(page.getByText("العادات: ٢/٣")).toBeVisible();
  await checkA11y(page);
  await page.getByLabel("كلمة عن يومك (اختياري)").fill("يوم هادئ");
  await page.getByRole("button", { name: "اختم يومي" }).click();
  await expect(page.getByRole("status")).toContainText(/./);
  await page.getByRole("link", { name: "العودة إلى يومك" }).click();
  await expect(page.getByText("ختمت يومك. نراك غدًا.")).toBeVisible();
});
