import "server-only";
import { createClient } from "@/lib/supabase/server";

export type DomainColor = "sage" | "dawn" | "gold" | "ink" | "violet";
export type LifeDomain = { id: string; key: string; name: string; icon: string; color: DomainColor; sort_order: number; active: boolean };
export type PlanDomain = { domainId: string; focusAreaId: string; hasDescription: boolean; habitCount: number };
export type LibraryHabit = { id: string; domain_id: string; name: string; amount: string | null; hint: string | null; icon: string | null; sort_order: number; active: boolean };

/** Life domains in order (spec 004 FR-001). Members get active ones; admins may ask for all. */
export async function getDomains({ includeInactive = false } = {}): Promise<LifeDomain[]> {
  const supabase = await createClient();
  let q = supabase.from("life_domains").select("id, key, name, icon, color, sort_order, active").order("sort_order");
  if (!includeInactive) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []) as LifeDomain[];
}

/** The current plan's domains (domain-linked focus areas, at most three). */
export async function getPlanDomains(): Promise<PlanDomain[]> {
  const supabase = await createClient();
  const { data: planId } = await supabase.rpc("current_plan_id");
  if (!planId) return [];
  const { data } = await supabase
    .from("focus_areas")
    .select("id, domain_id, description, sort_order, habits(count)")
    .eq("plan_id", planId)
    .not("domain_id", "is", null)
    .is("habits.archived_at", null)
    .order("sort_order");
  return (data ?? []).map((a) => ({
    domainId: a.domain_id as string,
    focusAreaId: a.id,
    hasDescription: Boolean(a.description?.trim()),
    habitCount: (a.habits as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}

/** «مكتبة العادات»: active suggestions (all for admins when asked), by domain then order. */
export async function getLibrary({ includeInactive = false } = {}): Promise<LibraryHabit[]> {
  const supabase = await createClient();
  let q = supabase.from("habit_library").select("id, domain_id, name, amount, hint, icon, sort_order, active").order("sort_order");
  if (!includeInactive) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []) as LibraryHabit[];
}
