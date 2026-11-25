import { notFound } from "next/navigation";
import { StatsView } from "@/components/features/stats/StatsView";
import { ChallengeListView } from "@/components/features/together/ChallengeListView";
import { TogetherView } from "@/components/features/together/TogetherView";
import { BottomNav } from "@/components/ui/BottomNav";
import type { Period } from "@/lib/period";
import { SAMPLE_BUCKETS, SAMPLE_CHALLENGES, SAMPLE_HEADER, SAMPLE_ICONS, SAMPLE_INSIGHTS, SAMPLE_STATS, SAMPLE_TODAY_DATE, SAMPLE_TOGETHER } from "../screens-sample";

export const metadata = { robots: { index: false } };

/**
 * Development-only «أثرك» with sample data (design comparison), rendering the pages' own views.
 * `?tab=group|challenge` for the other tabs; `?period=month|journey` for the period card.
 */
export default async function StatsPreview({ searchParams }: { searchParams: Promise<{ tab?: string; period?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = await searchParams;
  const period: Period = q.period === "month" || q.period === "journey" ? q.period : "week";
  const insights = period === "week" ? SAMPLE_INSIGHTS : { ...SAMPLE_INSIGHTS, buckets: SAMPLE_BUCKETS[period] };
  return (
    <div className="pb-24">
      {q.tab === "group" ? (
        <TogetherView header={SAMPLE_HEADER} data={SAMPLE_TOGETHER} challenge={SAMPLE_CHALLENGES[0]} />
      ) : q.tab === "challenge" ? (
        <ChallengeListView header={SAMPLE_HEADER} challenges={SAMPLE_CHALLENGES} />
      ) : (
        <StatsView header={SAMPLE_HEADER} period={period} today={SAMPLE_TODAY_DATE} stats={SAMPLE_STATS} insights={insights} icons={SAMPLE_ICONS} />
      )}
      <BottomNav current="/stats" />
    </div>
  );
}
