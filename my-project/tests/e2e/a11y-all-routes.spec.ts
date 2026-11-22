import { test, type Page } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { signIn } from "./helpers/auth";

// T137: WCAG 2.1 AA sweep over every route, for each role (constitution VI).
// Spec 002 T048: runs once per visual version (Playwright project), and again with the comfort
// settings: reduced transparency (the in-app attribute) and reduced motion.
const COMFORT = ["default", "reduced-transparency", "reduced-motion"] as const;

async function applyComfort(page: Page, mode: (typeof COMFORT)[number]) {
  await page.emulateMedia({ reducedMotion: mode === "reduced-motion" ? "reduce" : "no-preference" });
  if (mode === "reduced-transparency") await page.evaluate(() => document.documentElement.setAttribute("data-reduce-transparency", "true"));
}
const PUBLIC = ["/join", "/sign-in"];
const MEMBER = [
  "/", "/?day=yesterday", "/day/start", "/day/close", "/habits/new", "/plan", "/stats", "/stats?period=journey",
  "/community", "/groups", "/reviews", "/resources", "/resources/map", "/resources/guidelines",
  "/resources/recording", "/resources/file", "/resources/reference", "/more", "/account", "/account/archived-habits",
  "/account/appearance", "/setup/look",
  // Spec 003 (T030)
  "/plan/reflections", "/activities/00000000-0000-4000-8000-0000000000e2", "/habits/new?from=journey",
];
const FACILITATOR = ["/groups", "/groups/00000000-0000-4000-8000-0000000000a1", "/activities/00000000-0000-4000-8000-0000000000e2"];
const ADMIN = ["/admin", "/admin/activities/00000000-0000-4000-8000-0000000000e2", "/admin/cohorts", "/admin/cohorts/00000000-0000-4000-8000-0000000000c1", "/admin/invitations",
  "/admin/activities", "/admin/resources", ...["challenges", "closing", "questions", "phrases", "stages", "guidelines", "quotes", "domains", "library"].map((t) => `/admin/content?tab=${t}`)];

test("public routes", async ({ page }) => {
  for (const route of PUBLIC) {
    await page.goto(route);
    await checkA11y(page);
  }
});

for (const [role, email, routes] of [
  ["member", "member1@example.test", MEMBER],
  ["facilitator", "facilitator@example.test", FACILITATOR],
  ["admin", "admin@example.test", ADMIN],
] as const) {
  test(`${role} routes`, async ({ page }) => {
    test.setTimeout(540_000);
    await signIn(page, email);
    for (const mode of COMFORT) {
      for (const route of routes) {
        await page.goto(route);
        await applyComfort(page, mode);
        await checkA11y(page);
      }
    }
  });
}
