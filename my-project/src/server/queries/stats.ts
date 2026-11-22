import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MonthFigures } from "./reviews";

export { PERIODS, periodRange, type Period } from "@/lib/period";

export type MemberStats = Omit<MonthFigures, "habits"> & {
  habits: (MonthFigures["habits"][number] & { current_streak: number; longest_streak: number; grace_this_week?: boolean })[];
};
export type GroupStats = { members: number; avg_completion: number | null; journey_done: number; journey_possible: number; active_7d: number };
export type MemberSignal = { user_id: string; full_name: string; last_active: string | null; days_closed: number; completion_rate: number };

export async function getMemberStats(from: string, to: string): Promise<MemberStats | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("member_stats", { p_from: from, p_to: to });
  if (error) throw new Error(`member_stats failed: ${error.code}`);
  return data as MemberStats | null;
}

export async function getGroupStats(groupId: string, from: string, to: string): Promise<GroupStats | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("group_stats", { p_group: groupId, p_from: from, p_to: to });
  if (error) return null;
  return data as GroupStats;
}

export async function getGroupMemberSignals(groupId: string, from: string, to: string): Promise<MemberSignal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("group_member_signals", { p_group: groupId, p_from: from, p_to: to });
  if (error) return [];
  return (data ?? []).map((r) => ({ ...r, completion_rate: Number(r.completion_rate) })) as MemberSignal[];
}

/** «أثرك ← أنا» (spec 006): tiles, buckets, plan vs others, life areas. Member-only. */
export type MemberInsights = {
  from: string;
  to: string;
  consecutive_days: number;
  active_habits: number;
  plan_vs_other: { plan_done: number; plan_possible: number; other_done: number; other_possible: number };
  buckets: { from: string; to: string; done: number; possible: number }[];
  domains: { id: string; name: string; icon: string; color: "sage" | "dawn" | "gold" | "ink" | "violet"; habits: number; done: number; possible: number }[];
};

export async function getMemberInsights(from: string, to: string): Promise<MemberInsights | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("member_insights", { p_from: from, p_to: to });
  if (error) throw new Error(`member_insights failed: ${error.code}`);
  return data as unknown as MemberInsights | null;
}
