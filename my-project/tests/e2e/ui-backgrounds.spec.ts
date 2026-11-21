import { expect, test } from "@playwright/test";
import { signIn } from "./helpers/auth";

// Spec 002 T053 (FR-040–FR-042): background art never delays content and is skipped on Save-Data.
test("background image loads after the content", async ({ page }, info) => {
  test.skip(info.project.name === "ui-journey", "«رحلة يومي» has no background image");
  const order: string[] = [];
  page.on("requestfinished", (r) => {
    if (r.url().includes("/ui/bg-")) order.push("bg");
  });
  await signIn(page, "member1@example.test");
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  order.push("content");
  await page.waitForLoadState("networkidle");
  expect(order.indexOf("content")).toBeLessThanOrEqual(Math.max(0, order.indexOf("bg")));
});

test("Save-Data skips the background image", async ({ browser }, info) => {
  const context = await browser.newContext({
    ...info.project.use,
    extraHTTPHeaders: { "Save-Data": "on" },
  });
  const page = await context.newPage();
  const backgrounds: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/ui/bg-")) backgrounds.push(r.url());
  });
  await signIn(page, "member1@example.test");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("html")).toHaveAttribute("data-save-data", "true");
  expect(backgrounds).toEqual([]);
  await context.close();
});
