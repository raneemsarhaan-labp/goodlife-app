import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Together = {
  group: { id: string; name: string; cohort: string; start_date: string; members: number };
  sharing: boolean;
  items: { user_id: string; name: string; me: boolean; habit: string; done: boolean; together: number }[];
} | null;

/** «مجموعتي»: only what fellow members chose to share (spec 007 FR-001/002). */
export async function getTogether(): Promise<Together> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("group_together");
  return (data ?? null) as unknown as Together;
}

export type GroupChallenge = {
  id: string;
  title: string;
  description: string | null;
  habit_name: string;
  amount: string | null;
  days: number;
  starts_on: string;
  duration_days: number;
  domain: string | null;
  status: "upcoming" | "active";
  day: number;
  joined: boolean;
  kept: number;
  possible: number;
  group_joined: number;
  group_done_today: number;
};

/** «التحدّي»: the caller's challenges with own progress and group counts only (spec 007 FR-004). */
export async function getMyChallenges(): Promise<GroupChallenge[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_group_challenges");
  return (data ?? []) as unknown as GroupChallenge[];
}
