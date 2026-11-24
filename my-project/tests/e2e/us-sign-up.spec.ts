import { expect, test } from "@playwright/test";
import { fillSignUp, joinNewMember, newPhone, signIn } from "./helpers/auth";

// Sign up with email + mobile + password, confirmed by the emailed code; one account per email and
// per mobile; sign in again with either.
test("an email and a mobile register once; sign in with either", async ({ page, context }) => {
  await fillSignUp(page, { email: "member1@example.test", phone: newPhone() });
  await expect(page.getByText("هذا البريد مسجّل مسبقًا. سجّل الدخول به.")).toBeVisible();
  await fillSignUp(page, { email: `dup-${Date.now()}@example.test`, phone: "0500000003" });
  await expect(page.getByText("هذا الرقم مسجّل مسبقًا. سجّل الدخول به.")).toBeVisible();

  const email = await joinNewMember(page);
  await context.clearCookies();
  await page.goto("/sign-in");
  await page.getByLabel("البريد الإلكتروني أو رقم الجوال").fill(email);
  await page.getByLabel("كلمة المرور", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page.getByText("البيانات أو كلمة المرور غير صحيحة.")).toBeVisible();
  await signIn(page, email);
  await expect(page).toHaveURL("/");
});
