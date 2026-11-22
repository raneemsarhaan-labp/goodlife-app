import "server-only";
import { isReviewPromptOpen, reviewMonthFor } from "@/lib/review-window";
import { createClient } from "@/lib/supabase/server";

export type TodayHabit = {
  id: string;
  name: string;
  done: boolean;
  icon?: string | null;
  description?: string | null;
  week_done?: number;
  current_streak?: number;
  /** Spec 004 */
  amount?: string | null;
  time_of_day?: "morning" | "noon" | "evening" | "any";
  domain_id?: string | null;
  week?: { date: string; scheduled: boolean; done: boolean }[];
  week_scheduled?: number;
  /** Spec 007 */
  shared?: boolean;
  is_private?: boolean;
  challenge?: { id: string; title: string; day: number; days: number } | null;
};
export type TodayChallenge = { id: string; text: string; done: boolean };
export type TodayActivity = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  mode?: "in_person" | "online";
  registration_open?: boolean;
};
/** A registered activity with a session still ahead (spec 003 research §9). */
export type RegisteredActivity = {
  id: string;
  title: string;
  mode: "in_person" | "online";
  next_starts_at: string;
  next_ends_at: string | null;
  next_local_date: string;
  session_count: number;
  cancelled: boolean;
  dismissed_on: string | null;
};
export type LibraryChallenge = {
  id: string;
  title: string;
  prompt: string | null;
  style: "action" | "reflection";
  habit_name: string | null;
  domain: { id: string; name: string; icon: string; color: "sage" | "dawn" | "gold" | "ink" | "violet" };
  done: boolean;
  can_refresh: boolean;
};
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
  registered_activities?: RegisteredActivity[];
  /** Spec 005: the day's challenge from the library, and the plan review rhythm. */
  library_challenge?: LibraryChallenge | null;
  plan_review_due?: boolean | null;
  next_review_on?: string | null;
  /** «حالي المنشود» from the plan (spec 003). */
  desired_state?: string | null;
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
