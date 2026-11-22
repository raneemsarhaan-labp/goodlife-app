import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { signIn } from "./helpers/auth";

// Spec 003 US1 (T009): «حالي المنشود» on «يومك», «وقفة تأمل», history, privacy, offline.
// Seed: member1 has a desired state; member2 has none; facilitator leads their group.
test("member1 reflects on the desired state and finds it in the history", async ({ page }) => {
  await signIn(page, "member1@example.test");
  const card = page.getByRole("region", { name: "حالي المنشود" });
  await expect(card).toContainText("أستيقظ ولي وقتٌ لنفسي");
  await expect(card.getByRole("link", { name: /تعديل «حالي المنشود»/ })).toHaveAttribute("href", "/plan#desired-state");

  const note = `وقفة اختبار ${Date.now()}`;
  await card.getByLabel(/وقفة تأمل/).fill(note);
  await card.getByRole("button", { name: "احفظ التأمل" }).click();
  await expect(page.getByRole("status").filter({ hasText: "تمّ حفظ تأمّلك" })).toBeVisible();
  await expect(card.getByLabel(/وقفة تأمل/)).toHaveValue("");

  await page.goto("/plan/reflections");
  await checkA11y(page);
  const item = page.getByRole("listitem").filter({ hasText: note });
  await expect(item).toContainText("وقفة تأمل");
  await expect(item).toContainText("أستيقظ ولي وقتٌ لنفسي");
  await item.getByRole("button", { name: "احذف" }).click();
  await expect(page.getByText(note)).toHaveCount(0);
});

test("a member without a desired state is invited to write it", async ({ page }) => {
  await signIn(page, "member2@example.test");
  const card = page.getByRole("region", { name: "صِف الحال الذي تريد أن تبلغه" });
  await card.getByRole("link", { name: "اكتب حالي المنشود" }).click();
  await expect(page).toHaveURL("/plan#desired-state");
  await checkA11y(page);
  await page.getByLabel("حالي المنشود", { exact: true }).fill("أنام مبكرًا وأستيقظ بنشاط.");
  await page.getByRole("region", { name: "حالي المنشود" }).getByRole("button", { name: "احفظ" }).click();
  await expect(page.getByRole("status").filter({ hasText: "تمّ الحفظ." })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("region", { name: "حالي المنشود" })).toContainText("أنام مبكرًا");
  // Leave the seed as it was for other specs.
  await page.goto("/plan");
  await page.getByLabel("حالي المنشود", { exact: true }).fill("");
  await page.getByRole("region", { name: "حالي المنشود" }).getByRole("button", { name: "احفظ" }).click();
});

test("a reflection written offline is saved once on reconnect", async ({ page, context }) => {
  await signIn(page, "member1@example.test");
  const card = page.getByRole("region", { name: "حالي المنشود" });
  const note = `بلا اتصال ${Date.now()}`;
  await context.setOffline(true);
  await card.getByLabel(/وقفة تأمل/).fill(note);
  await card.getByRole("button", { name: "احفظ التأمل" }).click();
  await expect(page.getByText("سيُحفظ تأمّلك عند عودة الاتصال").first()).toBeVisible();
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(card.getByText("سيُحفظ تأمّلك عند عودة الاتصال")).toHaveCount(0);
  await page.goto("/plan/reflections");
  await expect(page.getByText(note)).toHaveCount(1);
});

test("the facilitator sees no desired state or reflections", async ({ page }) => {
  await signIn(page, "facilitator@example.test");
  for (const route of ["/groups", "/groups/00000000-0000-4000-8000-0000000000a1"]) {
    await page.goto(route);
    await expect(page.getByText("أستيقظ ولي وقتٌ لنفسي")).toHaveCount(0);
    await expect(page.getByText("وقفة تأمل")).toHaveCount(0);
  }
  await page.goto("/plan/reflections");
  await expect(page.getByText("أستيقظ ولي وقتٌ لنفسي")).toHaveCount(0);
});
