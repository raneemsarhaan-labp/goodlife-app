import { test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import { signIn } from "./helpers/auth";

// T137: WCAG 2.1 AA sweep over every route, for each role (constitution VI).
const PUBLIC = ["/join", "/sign-in"];
const MEMBER = [
  "/", "/?day=yesterday", "/day/start", "/day/close", "/habits/new", "/plan", "/stats", "/stats?period=journey",
  "/community", "/groups", "/reviews", "/resources", "/resources/map", "/resources/guidelines",
  "/resources/recording", "/resources/file", "/resources/reference", "/more", "/account", "/account/archived-habits",
];
const FACILITATOR = ["/groups", "/groups/00000000-0000-4000-8000-0000000000a1"];
const ADMIN = ["/admin", "/admin/cohorts", "/admin/cohorts/00000000-0000-4000-8000-0000000000c1", "/admin/invitations",
  "/admin/activities", "/admin/resources", ...["challenges", "closing", "questions", "phrases", "stages", "guidelines"].map((t) => `/admin/content?tab=${t}`)];

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
    test.setTimeout(180_000);
    await signIn(page, email);
    for (const route of routes) {
      await page.goto(route);
      await checkA11y(page);
    }
  });
}
