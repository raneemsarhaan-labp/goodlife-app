import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { ChallengeSummary } from "@/components/features/stats/ChallengeSummary";
import { HabitRateList } from "@/components/features/stats/HabitRateList";
import { PeriodTabs } from "@/components/features/stats/PeriodTabs";
import { RateBar } from "@/components/features/stats/RateBar";
import { StreakCard } from "@/components/features/stats/StreakCard";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatDate, formatNumber } from "@/lib/format";
import { PERIODS, periodRange, type Period } from "@/lib/period";
import { getMemberStats } from "@/server/queries/stats";
import { getToday } from "@/server/queries/today";

export const generateMetadata = pageTitle("stats");

/** «الإحصاءات» (US5, FR-035/036). */
export default async function StatsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const requested = (await searchParams).period as Period;
  const period: Period = PERIODS.includes(requested) ? requested : "week";
  const [t, today] = await Promise.all([getTranslations("stats"), getToday()]);
  if (!today?.cohort) {
    return (
      <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Card><p>{(await getTranslations("today"))("noJourney")}</p></Card>
      </main>
    );
  }
  const { from, to } = periodRange(period, today.local_date, today.cohort.start_date);
  const stats = await getMemberStats(from, to);
  const rate = stats && stats.habits_possible > 0 ? stats.habits_done / stats.habits_possible : 0;
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-ink-700">{t("intro")}</p>
      </header>
      <PeriodTabs active={period} basePath="/stats" />
      <p className="text-sm text-ink-500">{t("range", { from: formatDate(from, { withWeekday: false }), to: formatDate(to, { withWeekday: false }) })}</p>
      {stats && (
        <>
          <Card aria-labelledby="overall" className="flex flex-col gap-2">
            <CardTitle id="overall">{t("overallTitle")}</CardTitle>
            <p className="text-3xl font-semibold text-sage-700">{t("overall", { rate: formatNumber(rate, undefined, { style: "percent" }) })}</p>
            <RateBar rate={rate} />
            <p className="text-sm text-ink-500">{t("overallDetail", { done: formatNumber(stats.habits_done), possible: formatNumber(stats.habits_possible) })}</p>
          </Card>
          <StreakCard stats={stats} />
          <HabitRateList stats={stats} />
          <ChallengeSummary stats={stats} />
        </>
      )}
    </main>
  );
}
