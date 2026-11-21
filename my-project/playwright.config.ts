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
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"], locale: "ar" } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run build && npm run start", url: baseURL, timeout: 240_000, reuseExistingServer: true },
});
