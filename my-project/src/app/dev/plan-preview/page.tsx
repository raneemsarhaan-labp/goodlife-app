import { notFound } from "next/navigation";
import { PlanView } from "@/components/features/plan/PlanView";
import { BottomNav } from "@/components/ui/BottomNav";
import { SAMPLE_AREAS, SAMPLE_DOMAINS, SAMPLE_HABITS, SAMPLE_PLAN } from "../preview/plan-sample";

export const metadata = { robots: { index: false } };

/**
 * Development-only «خطتي» with sample data (screenshots, axe and design comparison), rendering the
 * page's own view. `?empty=1` shows a new member's plan; `?due=0` hides the review reminder.
 */
export default async function PlanPreview({ searchParams }: { searchParams: Promise<{ empty?: string; due?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = await searchParams;
  const empty = q.empty === "1";
  return (
    <div className="pb-24">
      <PlanView
        user={{ fullName: "سلمان العتيبي", timeZone: "Asia/Riyadh" }}
        today="2026-11-23"
        journeyDay={12}
        plan={empty ? { current_state: "", desired_state: "", identity: "", next_review_on: null, updated_at: SAMPLE_PLAN.updated_at } : SAMPLE_PLAN}
        areas={empty ? [] : SAMPLE_AREAS}
        habits={empty ? [] : SAMPLE_HABITS}
        previousHabitCount={empty ? 3 : 0}
        domains={SAMPLE_DOMAINS}
        reviewDue={!empty && q.due !== "0"}
      />
      <BottomNav />
    </div>
  );
}
