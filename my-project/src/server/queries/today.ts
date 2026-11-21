import "server-only";
import { createClient } from "@/lib/supabase/server";

export type TodayHabit = { id: string; name: string; done: boolean };
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
};

/** «يومك» read model in one round trip (supabase/migrations/0007_activities.sql › get_today). */
export async function getToday(which: "today" | "yesterday" = "today"): Promise<TodayData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_today", { p_which: which });
  if (error) throw new Error(`get_today failed: ${error.code}`);
  return (data as TodayData | null) ?? null;
}
