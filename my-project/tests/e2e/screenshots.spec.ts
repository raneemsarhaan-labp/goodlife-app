import { test } from "@playwright/test";
import { signIn } from "./helpers/auth";

// T141: RTL screenshots of every member screen on a phone viewport, for the PR review gate
// (constitution › Workflow). Spec 002 T052: one set per visual version (Playwright project).
// Output: test-results/screenshots/<project>/*.png (uploaded by CI).
const SCREENS: [string, string][] = [
  ["today", "/"], ["yesterday", "/?day=yesterday"], ["start-day", "/day/start"], ["close-day", "/day/close"],
  ["new-habit", "/habits/new"], ["plan", "/plan"], ["stats", "/stats"], ["community", "/community"],
  ["groups", "/groups"], ["reviews", "/reviews"], ["resources", "/resources"], ["journey-map", "/resources/map"],
  ["guidelines", "/resources/guidelines"], ["references", "/resources/reference"], ["more", "/more"],
  ["account", "/account"], ["archived-habits", "/account/archived-habits"],
  ["appearance", "/account/appearance"], ["setup-look", "/setup/look"],
  ["reflections", "/plan/reflections"], ["activity", "/activities/00000000-0000-4000-8000-0000000000e2"],
  ["make-habit", "/habits/new?from=journey"], ["plan-review", "/plan/review"],
];

test("member screens", async ({ page }, info) => {
  test.setTimeout(180_000);
  const dir = `test-results/screenshots/${info.project.name}`;
  for (const [name, route] of [["join", "/join"], ["sign-in", "/sign-in"]] as const) {
    await page.goto(route);
    await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
  }
  await signIn(page, "member1@example.test");
  for (const [name, route] of SCREENS) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
  }
});
