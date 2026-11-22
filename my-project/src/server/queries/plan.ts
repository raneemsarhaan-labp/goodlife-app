import "server-only";
import { createClient } from "@/lib/supabase/server";

export type PlanHabit = { id: string; name: string; description: string | null; focus_area_id: string | null; sort_order: number };
export type FocusArea = { id: string; title: string; description: string | null; sort_order: number };

/** The current journey's plan with its focus areas and active habits (RLS: owner only). */
export async function getPlan() {
  const supabase = await createClient();
  const { data: planId } = await supabase.rpc("current_plan_id");
  if (!planId) return null;
  const [{ data: plan }, { data: areas }, { data: habits }, { data: previousCount }] = await Promise.all([
    supabase.from("plans").select("id, current_state, desired_state, updated_at").eq("id", planId).single(),
    supabase.from("focus_areas").select("id, title, description, sort_order").eq("plan_id", planId).order("sort_order"),
    supabase
      .from("habits")
      .select("id, name, description, focus_area_id, sort_order")
      .eq("plan_id", planId)
      .is("archived_at", null)
      .order("sort_order"),
    supabase.rpc("previous_plan_habit_count"),
  ]);
  if (!plan) return null;
  return {
    plan,
    areas: (areas ?? []) as FocusArea[],
    habits: (habits ?? []) as PlanHabit[],
    previousHabitCount: Number(previousCount ?? 0),
  };
}

export async function getFocusAreas(): Promise<FocusArea[]> {
  const supabase = await createClient();
  const { data: planId } = await supabase.rpc("current_plan_id");
  if (!planId) return [];
  const { data } = await supabase.from("focus_areas").select("id, title, description, sort_order").eq("plan_id", planId).order("sort_order");
  return (data ?? []) as FocusArea[];
}
