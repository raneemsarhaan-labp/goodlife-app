import { expect, test } from "@playwright/test";
import { signIn } from "./helpers/auth";
import { renderedContrast } from "./helpers/contrast";

// Spec 002 US5 (T049, SC-004): text on glass keeps ≥ 4.5:1 against the rendered background
// (≥ 3:1 for large text), measured on pixels, in every version (one Playwright project each).
test("«يومك» text on cards is readable over the background", async ({ page }) => {
  await signIn(page, "member1@example.test");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("[data-habit-id]").first().waitFor();
  await page.waitForLoadState("networkidle");

  const samples = [
    { locator: page.getByRole("heading", { level: 1 }).first(), min: 3 },
    { locator: page.locator("[data-habit-id] > span").first(), min: 4.5 },
    { locator: page.locator("main p").first(), min: 4.5 },
    { locator: page.locator("ion-label p >> visible=true").first(), min: 4.5 },
    { locator: page.getByRole("heading", { name: "الأنشطة القادمة" }), min: 3 },
    { locator: page.locator("nav[aria-label] a").first(), min: 4.5 },
  ];
  for (const { locator, min } of samples) {
    if (!(await locator.count())) continue;
    const ratio = await renderedContrast(page, locator);
    expect(ratio, `${await locator.textContent()} → ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(min);
  }
});
