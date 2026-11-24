import { notFound } from "next/navigation";
import { TodayView } from "@/components/features/today/TodayView";
import { BottomNav } from "@/components/ui/BottomNav";
import type { TodayData } from "@/server/queries/today";
import { SAMPLE_TODAY } from "../sample";

export const metadata = { robots: { index: false } };

const QUOTE = { text: "الحياة الطيّبة: رحلةُ سعيٍ حثيث، لمقصدٍ معتبَر، بوعيٍ ناقدٍ مستبصر، ونفسٍ توّاقةٍ مطمئنّة، وقلبٍ سليم.", source: null };

/** A brand-new member: no desired state, habits, activities or intention yet. */
const EMPTY: TodayData = {
  ...SAMPLE_TODAY,
  journey_day: 1,
  habits: [],
  habits_total: 0,
  desired_state: null,
  own_challenge: null,
  activities: [],
  registered_activities: [],
  day: null,
};

const ONBOARDING = { setup_completed: false, dismissed: false, look: true, current_state: true, desired_state: false, domains: true, habit: false, intention: false, closed_day: false };

/**
 * Development-only «يومك» with sample data (gallery and design comparison), rendering the page's
 * own view. `?ritual=1` shows the opening quote; `?empty=1` a brand-new member (with «خطوات البداية»);
 * `?day=yesterday` the yesterday view.
 */
export default async function TodayPreview({ searchParams }: { searchParams: Promise<{ ritual?: string; empty?: string; day?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = await searchParams;
  const empty = q.empty === "1";
  const isToday = q.day !== "yesterday";
  return (
    <div className="pb-24">
      <TodayView
        user={{ fullName: "سلمان العتيبي", roles: ["member"], activeRole: "member", uiChosenAt: "2026-11-20T00:00:00Z" }}
        data={empty ? EMPTY : SAMPLE_TODAY}
        isToday={isToday}
        ritual={q.ritual === "1" ? { show: true, quote: QUOTE } : { show: false, quote: null }}
        onboarding={empty ? ONBOARDING : null}
      />
      <BottomNav />
    </div>
  );
}
