import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { StatsFrame, StatsView } from "@/components/features/stats/StatsView";
import { createClient } from "@/lib/supabase/server";
import { localDate } from "@/lib/journey";
import { PERIODS, periodRange, type Period } from "@/lib/period";
import { requireUser } from "@/server/auth";
import { getMemberInsights, getMemberStats } from "@/server/queries/stats";
import { getToday } from "@/server/queries/today";

export const generateMetadata = pageTitle("stats");

/** «أثرك» ← «أنا» (US5, FR-035/036; spec 006). Member-only figures, never a ranking. */
export default async function StatsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const requested = (await searchParams).period as Period;
  const period: Period = PERIODS.includes(requested) ? requested : "week";
  const [user, today] = await Promise.all([requireUser(), getToday()]);
  const header = {
    name: user.fullName,
    timeZone: user.timeZone,
    localDate: today?.local_date ?? localDate(user.timeZone),
    journeyDay: today?.journey_status === "active" ? today.journey_day : undefined,
  };
  if (!today?.cohort) {
    const t = await getTranslations("today");
    return (
      <StatsFrame header={header} active="me">
        <section className="sc-card">
          <p className="sc-text">{t("noJourney")}</p>
        </section>
      </StatsFrame>
    );
  }
  const { from, to } = periodRange(period, today.local_date, today.cohort.start_date);
  const supabase = await createClient();
  const [stats, insights, { data: habitIcons }] = await Promise.all([
    getMemberStats(from, to),
    getMemberInsights(from, to),
    supabase.from("habits").select("id, icon"),
  ]);
  const icons = Object.fromEntries((habitIcons ?? []).map((h) => [h.id, h.icon]));
  return <StatsView header={header} period={period} today={today.local_date} stats={stats} insights={insights} icons={icons} />;
}
