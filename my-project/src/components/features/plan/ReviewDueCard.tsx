import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/format";
import { Icon } from "@/ui/components/Icon";
import { flowIcon } from "@/ui/icons-flow";

/** «حان موعد مراجعتك» on «خطتي» and «يومك» (spec 005 FR-010), as the designed reminder strip. */
export async function ReviewDueCard({ nextReviewOn }: { nextReviewOn: string | null }) {
  const t = await getTranslations("planReview");
  return (
    <section aria-labelledby="review-due" className="pn-reminder">
      <span className="pn-reminder-icon" aria-hidden="true">
        <Icon src={flowIcon("notifications")} />
      </span>
      <div className="pn-reminder-text">
        <h2 id="review-due">{t("dueTitle")}</h2>
        <p>{nextReviewOn ? t("dueBody", { date: formatDate(nextReviewOn, { withWeekday: false }) }) : t("dueBodyFirst")}</p>
      </div>
      <Link href="/plan/review" aria-label={t("start")} className="pn-reminder-go td-hit">
        {t("startShort")}
      </Link>
    </section>
  );
}
