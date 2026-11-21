import { test } from "@playwright/test";
import { signIn } from "./helpers/auth";

// T141: RTL screenshots of every member screen on a phone viewport, for the PR review gate
// (constitution › Workflow). Output: test-results/screenshots/*.png (uploaded by CI).
const SCREENS: [string, string][] = [
  ["today", "/"], ["yesterday", "/?day=yesterday"], ["start-day", "/day/start"], ["close-day", "/day/close"],
  ["new-habit", "/habits/new"], ["plan", "/plan"], ["stats", "/stats"], ["community", "/community"],
  ["groups", "/groups"], ["reviews", "/reviews"], ["resources", "/resources"], ["journey-map", "/resources/map"],
  ["guidelines", "/resources/guidelines"], ["references", "/resources/reference"], ["more", "/more"],
  ["account", "/account"], ["archived-habits", "/account/archived-habits"],
];

test("member screens", async ({ page }) => {
  test.setTimeout(180_000);
  for (const [name, route] of [["join", "/join"], ["sign-in", "/sign-in"]] as const) {
    await page.goto(route);
    await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }
  await signIn(page, "member1@example.test");
  for (const [name, route] of SCREENS) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }
});
