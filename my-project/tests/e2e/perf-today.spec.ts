import { expect, test } from "@playwright/test";
import { signIn } from "./helpers/auth";

// T138 / SC-003: «يومك» is usable within 3 s on a mid-range phone over 4G.
// Emulates ~4G (9 Mbps down, 1.5 Mbps up, 170 ms RTT) and a 4× slower CPU.
test("«يومك» is interactive within 3 seconds on a throttled mobile profile", async ({ page }) => {
  await signIn(page, "member1@example.test");
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 170,
    downloadThroughput: (9 * 1024 * 1024) / 8,
    uploadThroughput: (1.5 * 1024 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  const start = Date.now();
  await page.goto("/", { waitUntil: "commit" });
  const firstHabit = page.locator("[data-habit-id] button[aria-pressed]").first();
  await expect(firstHabit).toBeEnabled();
  // Interactive: a tap is handled (optimistic update) — then undo it.
  await firstHabit.click();
  const elapsed = Date.now() - start;
  await firstHabit.click();
  expect(elapsed).toBeLessThan(3000);
});
