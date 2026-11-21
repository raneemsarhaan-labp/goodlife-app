import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { monthKey, monthsBetween } from "@/lib/review-window";
import { getToday } from "@/server/queries/today";
import { getReviewStatuses } from "@/server/queries/reviews";

export const metadata = { title: "مراجعاتي" };

/** Past monthly reviews, done or not yet done (FR-032). */
export default async function ReviewsPage() {
  const [t, today, statuses] = await Promise.all([getTranslations("review"), getToday(), getReviewStatuses()]);
  const months = today?.cohort ? monthsBetween(today.cohort.start_date, today.local_date) : [];
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <h1 className="text-2xl font-semibold">{t("listTitle")}</h1>
      <p className="text-ink-700">{t("listIntro")}</p>
      {months.length === 0 ? (
        <EmptyState title={t("none")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {months.map((m) => {
            const status = statuses.get(m);
            const name = new Intl.DateTimeFormat("ar-u-nu-arab", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}T12:00:00Z`));
            return (
              <li key={m}>
                <Card className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className={`text-sm ${status === "completed" ? "text-sage-700" : "text-ink-500"}`}>
                      {status === "completed" ? t("done") : status === "draft" ? t("draft") : t("notDone")}
                    </p>
                  </div>
                  <Link href={`/reviews/${monthKey(m)}`} className="text-sage-700 underline underline-offset-4" aria-label={`${t("open")}: ${name}`}>
                    {t("open")}
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
