import { getTranslations } from "next-intl/server";
import { ScreenHeader } from "@/components/features/screens/ScreenHeader";
import type { Period } from "@/lib/period";
import type { MemberInsights, MemberStats } from "@/server/queries/stats";
import { ChallengeSummary } from "./ChallengeSummary";
import { CompletionBars } from "./CompletionBars";
import { LifeAreas } from "./LifeAreas";
import { PlanVsOther } from "./PlanVsOther";
import { StatTiles } from "./StatTiles";
import { StatsTabs } from "./StatsTabs";
import { StreakList } from "./StreakList";

export type StatsHeader = { name: string; timeZone: string; localDate: string; journeyDay?: number };

/** «أثرك» frame: the header and the «أنا · مجموعتي · التحدّي» tabs, around each tab's body. */
export async function StatsFrame({ header, active, children }: { header: StatsHeader; active: "me" | "group" | "challenge"; children: React.ReactNode }) {
  const t = await getTranslations("impact");
  return (
    <main id="main" className="sc-page">
      <ScreenHeader title={t("title")} {...header} />
      <div className="sc-content">
        <StatsTabs active={active} />
        {children}
      </div>
    </main>
  );
}

/** «أثرك ← أنا» (US5, spec 006) as the Glass Edition draws it; props only (page and preview). */
export async function StatsView({
  header,
  period,
  today,
  stats,
  insights,
  icons,
}: {
  header: StatsHeader;
  period: Period;
  today: string;
  stats: MemberStats | null;
  insights: MemberInsights | null;
  icons: Record<string, string | null>;
}) {
  const rate = stats && stats.habits_possible > 0 ? stats.habits_done / stats.habits_possible : 0;
  return (
    <StatsFrame header={header} active="me">
      {stats && insights && (
        <>
          <StatTiles
            consecutive={insights.consecutive_days}
            rate={rate}
            done={stats.habits_done}
            possible={stats.habits_possible}
            activeHabits={insights.active_habits}
            challengesDone={stats.journey_done + stats.own_done}
            period={period}
          />
          <PlanVsOther data={insights.plan_vs_other} />
          <CompletionBars buckets={insights.buckets} period={period} today={today} />
          <StreakList stats={stats} icons={icons} />
          <LifeAreas domains={insights.domains} />
          <div style={{ marginTop: 14 }}>
            <ChallengeSummary stats={stats} />
          </div>
        </>
      )}
    </StatsFrame>
  );
}
