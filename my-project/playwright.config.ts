import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    locale: "ar",
    timezoneId: "Asia/Riyadh",
    trace: "off",
  },
  // One project per visual version (spec 002 research §10): every spec runs in all three.
  projects: (["journey", "glass", "full-glass"] as const).map((ui) => ({
    name: `ui-${ui}`,
    use: {
      ...devices["Pixel 7"],
      locale: "ar",
      storageState: { cookies: [{ name: "gl_ui", value: ui, domain: new URL(baseURL).hostname, path: "/", expires: -1, httpOnly: true, secure: false, sameSite: "Lax" as const }], origins: [] },
    },
  })),
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: process.env.CI ? "npm run start" : "npm run build && npm run start", url: baseURL, timeout: 240_000, reuseExistingServer: true },
});
