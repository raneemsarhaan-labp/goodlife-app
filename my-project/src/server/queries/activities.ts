import "server-only";
import { utcToZonedLocal } from "@/lib/time";
import { createClient } from "@/lib/supabase/server";
import type { ActivityDraft } from "@/components/features/admin/ActivityForm";

export type ActivityWithAudience = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  cancelled_at: string | null;
  created_by: string | null;
  activity_audiences: { cohort_id: string | null; group_id: string | null; cohorts: { name: string } | null; groups: { name: string } | null }[];
};

/** Activities visible to the caller (RLS), optionally limited to some groups. */
export async function listActivities(groupIds?: string[]): Promise<ActivityWithAudience[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("id, title, description, starts_at, ends_at, location, cancelled_at, created_by, activity_audiences(cohort_id, group_id, cohorts(name), groups(name))")
    .order("starts_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as ActivityWithAudience[];
  return groupIds ? rows.filter((a) => a.activity_audiences.some((au) => au.group_id && groupIds.includes(au.group_id))) : rows;
}

export function toDraft(a: ActivityWithAudience, timeZone: string): ActivityDraft {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    startsAt: utcToZonedLocal(a.starts_at, timeZone),
    endsAt: a.ends_at ? utcToZonedLocal(a.ends_at, timeZone) : undefined,
    location: a.location,
    groupIds: a.activity_audiences.flatMap((au) => (au.group_id ? [au.group_id] : [])),
    cohortId: a.activity_audiences.find((au) => au.cohort_id)?.cohort_id ?? null,
  };
}
