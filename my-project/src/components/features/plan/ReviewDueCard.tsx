import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/format";

/** «حان موعد مراجعتك» on «خطتي» and «يومك» (spec 005 FR-010). */
export async function ReviewDueCard({ nextReviewOn }: { nextReviewOn: string | null }) {
  const t = await getTranslations("planReview");
  return (
    <section aria-labelledby="review-due" className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-gold-500 bg-gold-100 p-4">
      <h2 id="review-due" className="font-semibold text-ink-900">{t("dueTitle")}</h2>
      <p className="text-sm text-ink-900">
        {nextReviewOn ? t("dueBody", { date: formatDate(nextReviewOn, { withWeekday: false }) }) : t("dueBodyFirst")}
      </p>
      <Link href="/plan/review" className="inline-flex min-h-11 items-center self-start rounded-full bg-dawn-700 px-5 font-medium text-white">
        {t("start")}
      </Link>
    </section>
  );
}
