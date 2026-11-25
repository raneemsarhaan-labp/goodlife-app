import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { joinNewMember, signIn } from "./helpers/auth";

// Spec 007. Seed: member1 shares «قراءة عشر صفحات» and «مشي عشرين دقيقة»; member2 shares «مشي عشرين دقيقة»;
// «أسبوع الصلة» is running for the seed cohort; «شهر الحركة» is upcoming; the reading circle has a presenter.

test("«مجموعتي»: peers see shared habits only; «٢ منكم»; facilitator sees none", async ({ page, browser }) => {
  await signIn(page, "member2@example.test");
  await page.goto("/stats/group");
  await checkA11y(page);
  const peers = page.getByRole("region", { name: "من يمشي معك على العادة نفسها" });
  await expect(peers.getByText("قراءة عشر صفحات")).toBeVisible();
  await expect(peers.getByText("النوم قبل الحادية عشرة")).toHaveCount(0);
  await expect(peers.getByText(/٢ منكم/)).toBeVisible();
  await expect(page.getByRole("region", { name: "ما تظهره أنت" })).toContainText("مشي عشرين دقيقة");

  const fac = await browser.newContext({ storageState: { cookies: [], origins: [] }, locale: "ar", timezoneId: "Asia/Riyadh" });
  const pf = await fac.newPage();
  await signIn(pf, "facilitator@example.test");
  for (const route of ["/groups/00000000-0000-4000-8000-0000000000a1", "/stats/group"]) {
    await pf.goto(route);
    await expect(pf.getByText("قراءة عشر صفحات")).toHaveCount(0);
  }
  await fac.close();
});

test("group challenge: join → locked habit on «يومك» → progress without ranks → withdraw", async ({ page }) => {
  await joinNewMember(page);
  await page.goto("/stats/challenge");
  await checkA11y(page);
  const running = page.getByRole("region", { name: "أسبوع الصلة" });
  await expect(running).toContainText(/اليوم ٦ من ٧/);
  await running.getByRole("button", { name: "انضمّ" }).click();
  await expect(running.getByRole("status")).toHaveText("انضممتَ. تجد العادة في «يومك».");
  await expect(page.getByText(/لوحة الترتيب|الترتيب/)).toHaveCount(0);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "وردي من القرآن", exact: true })).toBeVisible();
  await expect(page.getByText(/تحدّي المجموعة · اليوم ٦ من ٧/)).toBeVisible();
  await page.goto("/stats/challenge");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("region", { name: "أسبوع الصلة" }).getByRole("button", { name: "انسحب من التحدّي" }).click();
  await expect(page.getByRole("region", { name: "أسبوع الصلة" }).getByRole("button", { name: "انضمّ" })).toBeVisible();
  await expect(page.getByRole("region", { name: "شهر الحركة" })).toContainText("تحدٍّ قادم");
});

test("«المجتمع» lists every upcoming activity with presenter and badges", async ({ page }) => {
  await signIn(page, "member1@example.test");
  await page.goto("/community");
  await checkA11y(page);
  const list = page.getByRole("region", { name: "أنشطة قادمة" });
  await list.getByText("نشاط قراءة: أمراض القلوب").click();
  await expect(list.getByRole("definition").filter({ hasText: "أ. سارة الأحمد" })).toBeVisible();
  await expect(list.getByText("أونلاين").first()).toBeVisible();
});

test("«عادة خاصّة»: name on this device only", async ({ page, browser }) => {
  const email = await joinNewMember(page);
  await page.goto("/habits/new");
  await page.getByRole("radio").first().click();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "عادة من عندي" }).click();
  await page.getByLabel("اسم العادة").fill("دواء الضغط");
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByLabel(/عادة خاصّة/).check();
  await expect(page.getByLabel(/أظهر هذه العادة لمجموعتي/)).toBeDisabled();
  await page.getByRole("button", { name: "حفظ العادة" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "دواء الضغط", exact: true })).toBeVisible();

  const other = await browser.newContext({ storageState: { cookies: [], origins: [] }, locale: "ar", timezoneId: "Asia/Riyadh" });
  const po = await other.newPage();
  await signIn(po, email);
  await expect(po.getByRole("button", { name: "عادة خاصّة", exact: true })).toBeVisible();
  await expect(po.getByText("دواء الضغط")).toHaveCount(0);
  await other.close();
});
