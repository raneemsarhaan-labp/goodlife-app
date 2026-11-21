import { getTranslations } from "next-intl/server";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";
import type { MemberStats } from "@/server/queries/stats";
import { RateBar } from "./RateBar";

/** Journey and own challenges, always shown separately (FR-035). */
export async function ChallengeSummary({ stats }: { stats: MemberStats }) {
  const t = await getTranslations("stats");
  return (
    <Card aria-labelledby="challenges" className="flex flex-col gap-3">
      <CardTitle id="challenges">{t("challengesTitle")}</CardTitle>
      <div className="flex flex-col gap-1">
        <p>{t("journey", { done: formatNumber(stats.journey_done), total: formatNumber(stats.journey_total) })}</p>
        <RateBar rate={stats.journey_total ? stats.journey_done / stats.journey_total : 0} />
      </div>
      <div className="flex flex-col gap-1">
        <p>{t("own", { done: formatNumber(stats.own_done), written: formatNumber(stats.own_written) })}</p>
        <RateBar rate={stats.own_written ? stats.own_done / stats.own_written : 0} />
      </div>
      <p className="text-ink-700">{t("daysClosed", { count: formatNumber(stats.days_closed), days: formatNumber(stats.days) })}</p>
    </Card>
  );
}
