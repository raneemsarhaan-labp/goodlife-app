import { expect, test } from "@playwright/test";
import { isReviewPromptOpen, monthKey, reviewMonthFor } from "../../src/lib/review-window";
import { checkA11y } from "./helpers/axe";
import { signIn } from "./helpers/auth";

// quickstart.md scenario 5 (US4). The prompt depends on the server's date, so it is asserted
// only when today is inside the review window; the review itself is always exercised.
test("monthly review: figures, draft, complete, read-only", async ({ page }) => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
  await signIn(page, "member1@example.test");

  if (isReviewPromptOpen(today)) {
    await expect(page.getByRole("link", { name: "ابدأ المراجعة" })).toBeVisible();
  } else {
    await expect(page.getByRole("link", { name: "ابدأ المراجعة" })).toHaveCount(0);
  }

  const month = monthKey(isReviewPromptOpen(today) ? reviewMonthFor(today) : `${today.slice(0, 7)}-01`);
  await page.goto(`/reviews/${month}`);
  await expect(page.getByRole("heading", { name: "شهرك بالأرقام" })).toBeVisible();
  await expect(page.getByText(/الالتزام بالعادات/)).toBeVisible();
  await checkA11y(page);

  const firstQuestion = page.getByRole("textbox").first();
  await firstQuestion.fill("القراءة صارت جزءًا من صباحي.");
  await page.getByRole("button", { name: "احفظ مسودة" }).click();
  await expect(page.getByRole("status").filter({ hasText: "حُفظت المسودة." })).toBeVisible();

  await page.goto("/reviews");
  await expect(page.getByText("مسودة").first()).toBeVisible();
  await page.goto(`/reviews/${month}`);
  await expect(page.getByRole("textbox").first()).toHaveValue("القراءة صارت جزءًا من صباحي.");
  await page.getByRole("button", { name: "أكمل المراجعة" }).click();
  await expect(page.getByRole("status").filter({ hasText: "اكتملت مراجعتك" })).toBeVisible();

  await page.reload();
  await expect(page.getByText("هذه المراجعة مكتملة ولا يمكن تعديلها.")).toBeVisible();
  await expect(page.getByText("القراءة صارت جزءًا من صباحي.")).toBeVisible();
  await expect(page.getByRole("button", { name: "أكمل المراجعة" })).toHaveCount(0);
});
