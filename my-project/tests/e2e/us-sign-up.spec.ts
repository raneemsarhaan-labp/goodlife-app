import { expect, test } from "@playwright/test";
import { joinNewMember, SEED_PASSWORD, signIn } from "./helpers/auth";

// Sign up with mobile + password; one account per mobile; sign in again with the same details.
test("a mobile registers once, then signs in with its password", async ({ page, context }) => {
  // A seed member's mobile is already registered.
  await page.goto("/join");
  await page.getByLabel("الاسم الكامل").fill("شخص آخر");
  await page.getByLabel("رقم الجوال").fill("0500000003");
  await page.getByLabel("كلمة المرور", { exact: true }).fill(SEED_PASSWORD);
  await page.getByLabel("أعد كتابة كلمة المرور").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "أنشئ حسابي" }).click();
  await expect(page.getByText("هذا الرقم مسجّل مسبقًا. سجّل الدخول به.")).toBeVisible();

  // A new mobile signs up, signs out, and signs back in (typed in the local 05… form).
  const phone = await joinNewMember(page);
  await context.clearCookies();
  await page.goto("/sign-in");
  await page.getByLabel("رقم الجوال").fill(phone);
  await page.getByLabel("كلمة المرور").fill("wrong-password");
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page.getByText("رقم الجوال أو كلمة المرور غير صحيحة.")).toBeVisible();
  await signIn(page, phone);
  await expect(page).toHaveURL("/");
});
