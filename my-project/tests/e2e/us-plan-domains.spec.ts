import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { joinNewMember, signIn } from "./helpers/auth";

// Spec 005 US1 (T007): «هويّتي» and domain cards in «خطتي»; private to the member.
test("«هويّتي» and a domain card are saved and stay private", async ({ page, browser }) => {
  await joinNewMember(page);
  await page.goto("/habits/new");
  await page.getByRole("button", { name: "أضف «النفس والبدن» إلى خطتك" }).click();
  await expect(page.getByRole("button", { name: "أخرج «النفس والبدن» من خطتك" })).toBeVisible();

  await page.goto("/plan");
  await checkA11y(page);
  const identity = page.getByRole("region", { name: "هويّتي" });
  await identity.getByLabel("هويّتي").fill("أنا ساعٍ إلى يومٍ أهدأ.");
  await identity.getByRole("button", { name: "احفظ" }).click();
  await expect(identity.getByRole("status")).toHaveText("تمّ الحفظ.");

  await page.getByText("النفس والبدن", { exact: true }).first().click();
  await page.getByLabel("من أريد أن أكون في هذا المجال").fill("جسدٌ نشيط.");
  await page.getByLabel("العلامة التي أعرف بها أني صرتُ").fill("أصعد الدرج دون تعب.");
  await page.getByRole("button", { name: "احفظ المجال" }).click();
  await expect(page.getByRole("status").filter({ hasText: "تمّ الحفظ." }).first()).toBeVisible();
  await page.reload();
  // Written texts show as designed; the edit control opens them again.
  await page.getByRole("button", { name: "عدّل «هويّتي»" }).click();
  await expect(page.getByLabel("هويّتي")).toHaveValue("أنا ساعٍ إلى يومٍ أهدأ.");

  const fac = await browser.newContext({ storageState: { cookies: [], origins: [] }, locale: "ar", timezoneId: "Asia/Riyadh" });
  const pf = await fac.newPage();
  await signIn(pf, "facilitator@example.test");
  await pf.goto("/groups/00000000-0000-4000-8000-0000000000a1");
  await expect(pf.getByText("أنا ساعٍ إلى يومٍ أهدأ.")).toHaveCount(0);
  await expect(pf.getByText("أصعد الدرج دون تعب.")).toHaveCount(0);
  await fac.close();
});
