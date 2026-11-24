import { expect, test } from "@playwright/test";
import { fillSignUp, joinNewMember, newPhone, signIn, signInWithCode } from "./helpers/auth";

// Sign up with name + email + mobile, confirmed by the emailed code; one account per email and per
// mobile; sign in again with a code sent to the email.
test("an email and a mobile register once; sign in again with a code", async ({ page, context }) => {
  await fillSignUp(page, { email: "member1@example.test", phone: newPhone() });
  await expect(page.getByText("هذا البريد مسجّل مسبقًا. سجّل الدخول به.")).toBeVisible();
  await fillSignUp(page, { email: `dup-${Date.now()}@example.test`, phone: "0500000003" });
  await expect(page.getByText("هذا الرقم مسجّل مسبقًا. سجّل الدخول به.")).toBeVisible();

  const email = await joinNewMember(page);
  await context.clearCookies();
  await signInWithCode(page, email);
  await expect(page).toHaveURL("/");
});

// «حسابي» → «كلمة المرور»: choose a password, then sign in with it instead of a code.
test("a member chooses a password and signs in with it", async ({ page, context }) => {
  const email = await joinNewMember(page);
  await page.goto("/account");
  await page.getByLabel("كلمة المرور الجديدة", { exact: true }).fill("my-new-pass1");
  await page.getByLabel("أعد كتابة كلمة المرور").fill("my-new-pass1");
  await page.getByRole("button", { name: "احفظ كلمة المرور" }).click();
  await expect(page.getByText("حُفظت كلمة المرور. تقدر تدخل بها من الآن.")).toBeVisible();
  await context.clearCookies();
  await signIn(page, email, "my-new-pass1");
  await expect(page).toHaveURL("/");
});
