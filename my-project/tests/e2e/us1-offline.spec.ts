import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers/auth";

// quickstart.md scenario 2 (US1, research.md §4). Requires `supabase start` + seed.
// Seeded member1 has four habits in the seed cohort.

async function queue(page: Page, daysAgo: number, habitName: string) {
  const habitId = await page.getByRole("checkbox", { name: habitName }).evaluate((el) => el.closest("li")?.dataset.habitId ?? "");
  await page.evaluate(
    async ({ daysAgo, habitId }) => {
      const tapped = new Date(Date.now() - daysAgo * 86_400_000);
      const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(tapped);
      const req = indexedDB.open("goodlife-outbox", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("mutations", { keyPath: "clientMutationId" });
      const db: IDBDatabase = await new Promise((r) => (req.onsuccess = () => r(req.result)));
      await new Promise<void>((resolve) => {
        const tx = db.transaction("mutations", "readwrite");
        tx.objectStore("mutations").put({
          clientMutationId: crypto.randomUUID(),
          kind: "habit",
          payload: { habitId, localDate, done: true },
          recordedAt: tapped.toISOString(),
          createdAt: Date.now(),
        });
        tx.oncomplete = () => resolve();
      });
    },
    { daysAgo, habitId },
  );
}

test("offline check-off is saved once on reconnect; late replays follow the 7-day rule", async ({ page, context }) => {
  await signIn(page, "member1@example.test");
  const habit = page.getByRole("checkbox", { name: "قراءة عشر صفحات" });
  await expect(habit).toBeVisible();
  const wasChecked = await habit.isChecked();

  // Offline tap → pending; back online → saved once.
  await context.setOffline(true);
  await habit.setChecked(!wasChecked);
  await expect(page.getByText("سيُحفظ عند عودة الاتصال").first()).toBeVisible();
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.locator("li", { hasText: "قراءة عشر صفحات" }).getByText("سيُحفظ عند عودة الاتصال")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "قراءة عشر صفحات" })).toBeChecked({ checked: !wasChecked });

  // A queued tap from 2 days ago is accepted for its own day (no "not saved" notice).
  await queue(page, 2, "مشي عشرين دقيقة");
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.waitForTimeout(1500);
  await expect(page.getByText("لم نتمكن من حفظ هذا التسجيل")).toHaveCount(0);

  // A queued tap from 8 days ago is refused, dropped, and the member is told calmly.
  await queue(page, 8, "مشي عشرين دقيقة");
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.getByText("لم نتمكن من حفظ هذا التسجيل")).toBeVisible();
});
