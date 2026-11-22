import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { signIn } from "./helpers/auth";

// quickstart.md scenario 10 (US8).
test("profile edit, role switch without sign-out, «المزيد»", async ({ page }) => {
  await signIn(page, "facilitator@example.test"); // member + facilitator
  await expect(page).toHaveURL("/groups");

  await page.goto("/account");
  await checkA11y(page);
  await page.getByLabel("المدينة (اختياري)").fill("المدينة المنورة");
  await page.getByRole("button", { name: "احفظ" }).click();
  await expect(page.getByRole("status").filter({ hasText: "تمّ الحفظ." })).toBeVisible();

  await page.getByRole("button", { name: "انتقل إلى دور مشارك" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByText("أنت الآن: مشارك")).toBeVisible();
  await page.getByRole("button", { name: "انتقل إلى دور ميسّر" }).click();
  await expect(page).toHaveURL("/groups");

  await page.goto("/more");
  for (const name of ["الموارد", "مجموعاتي", "مراجعاتي", "حسابي"]) {
    await expect(page.getByRole("link", { name })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "لوحة الإدارة" })).toHaveCount(0);
  await checkA11y(page);
});

test("installable: manifest is standalone, RTL Arabic, with the bottom navigation", async ({ page, request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ display: "standalone", dir: "rtl", lang: "ar", start_url: "/" });
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
  expect((await request.get("/sw.js")).ok()).toBe(true);

  await signIn(page, "member1@example.test");
  const nav = page.getByRole("navigation", { name: "التنقل الرئيسي" });
  await expect(nav.getByRole("link")).toHaveText(["يومك", "خطتي", "الإحصاءات", "المجتمع", "المزيد"]);
});

test("data export downloads my data as JSON", async ({ page }) => {
  await signIn(page, "member2@example.test");
  await page.goto("/account");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "نزّل بياناتي" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("goodlife-my-data.json");
  // Spec 003 FR-007 (T032): the export includes the desired state, reflections and registrations.
  const { readFile } = await import("node:fs/promises");
  const data = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(data).toHaveProperty("reflections");
  expect(data).toHaveProperty("activity_registrations");
  expect(data.plans[0]).toHaveProperty("desired_state");
});
