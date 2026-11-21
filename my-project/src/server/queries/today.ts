import "server-only";
import { isReviewPromptOpen, reviewMonthFor } from "@/lib/review-window";
import { createClient } from "@/lib/supabase/server";

export type TodayHabit = { id: string; name: string; done: boolean; icon?: string | null; description?: string | null; week_done?: number; current_streak?: number };
export type TodayChallenge = { id: string; text: string; done: boolean };
export type TodayActivity = { id: string; title: string; starts_at: string; ends_at: string | null; location: string | null };
export type JourneyStatus = "none" | "not_started" | "active" | "ended";

export type TodayData = {
  local_date: string;
  time_zone: string;
  journey_status: JourneyStatus;
  journey_day?: number;
  cohort?: { id: string; name: string; start_date: string; end_date: string };
  habits?: TodayHabit[];
  habits_total?: number;
  journey_challenge?: TodayChallenge | null;
  own_challenge?: TodayChallenge | null;
  day?: { intention: string | null; reflection: string | null; closed_at: string | null } | null;
  activities?: TodayActivity[];
  /** First day of the month to review, when the review prompt should show (FR-030). */
  review_prompt?: string | null;
};

/** «يومك» read model in one round trip (supabase/migrations/0007_activities.sql › get_today). */
export async function getToday(which: "today" | "yesterday" = "today"): Promise<TodayData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_today", { p_which: which });
  if (error) throw new Error(`get_today failed: ${error.code}`);
  const today = (data as TodayData | null) ?? null;
  if (today?.cohort && which === "today" && isReviewPromptOpen(today.local_date)) {
    const month = reviewMonthFor(today.local_date);
    const monthEnd = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).toISOString().slice(0, 10);
    if (monthEnd >= today.cohort.start_date) {
      const { data: review } = await supabase.from("monthly_reviews").select("status").eq("month", month).eq("cohort_id", today.cohort.id).maybeSingle();
      today.review_prompt = review?.status === "completed" ? null : month;
    }
  }
  return today;
}
