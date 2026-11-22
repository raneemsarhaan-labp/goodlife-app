import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { addOwnHabit } from "./helpers/auth";

// quickstart.md scenario 1 (US1). Requires `supabase start` + `supabase db reset` (seed).
test("join with a code and live a full day on «يومك»", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.test`;

  // Join: code → personal data → welcome (signed in, no email code).
  await page.goto("/join");
  await checkA11y(page);
  await page.getByLabel("رمز الدعوة").fill("taybah26");
  await page.getByRole("button", { name: "تحقّق من الرمز" }).click();
  await expect(page).toHaveURL("/join/profile");
  await expect(page.getByText("مجموعة النور")).toBeVisible();
  await checkA11y(page);

  await page.getByLabel("الاسم الكامل").fill("مشارك الاختبار");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  // Joining signs the member in directly: no email round trip.
  await page.getByRole("button", { name: "أنشئ حسابي" }).click();
  await expect(page).toHaveURL("/welcome");
  await checkA11y(page);
  await page.getByRole("link", { name: "ابدأ رحلتك" }).click();
  // Spec 002: the look step comes next; skipping keeps «رحلة يومي».
  await expect(page).toHaveURL("/setup/look");
  await page.getByRole("button", { name: "تخطَّ الآن" }).click();
  await expect(page).toHaveURL("/");

  // «يومك»: journey day 12 (seed cohort started 11 days ago), no habits yet.
  await expect(page.getByText("اليوم ١٢ من رحلتك")).toBeVisible();
  await checkA11y(page);
  for (const name of ["قراءة", "مشي", "نوم مبكر"]) {
    await addOwnHabit(page, name);
  }

  // Check two habits → ٢/٣.
  await page.getByRole("button", { name: "قراءة", exact: true }).click();
  await page.getByRole("button", { name: "مشي", exact: true }).click();
  await expect(page.getByText("٢/٣", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("٢/٣", { exact: true })).toBeVisible();

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
  await expect(page.getByText("٠/٣", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "قراءة", exact: true }).click();
  await expect(page.getByText("١/٣", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "اليوم", exact: true }).click();
  await expect(page.getByText("٢/٣", { exact: true })).toBeVisible();

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
