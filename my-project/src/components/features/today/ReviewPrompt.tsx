import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClass } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { monthKey } from "@/lib/review-window";

/** Gentle invitation to the monthly review (FR-030). */
export async function ReviewPrompt({ month }: { month: string }) {
  const t = await getTranslations("review");
  const monthName = new Intl.DateTimeFormat("ar-u-nu-arab", { month: "long", timeZone: "UTC" }).format(new Date(`${month}T12:00:00Z`));
  return (
    <section aria-labelledby="review-prompt" className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-sage-100 bg-white p-5">
      <h2 id="review-prompt" className="text-lg font-semibold">{t("promptTitle", { month: monthName })}</h2>
      <p className="text-ink-700">{t("promptBody")}</p>
      <Link href={`/reviews/${monthKey(month)}`} className={buttonClass("secondary", "self-start")} aria-describedby="review-prompt">
        {t("promptAction")}
      </Link>
      <span className="sr-only">{formatDate(month, { withWeekday: false, withYear: true })}</span>
    </section>
  );
}
