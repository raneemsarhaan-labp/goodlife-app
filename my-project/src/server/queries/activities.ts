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
  registration_open: boolean;
  capacity: number | null;
  mode: "in_person" | "online";
  activity_sessions: { starts_at: string; ends_at: string | null }[];
  activity_links: { meeting_url: string } | null;
  activity_audiences: { cohort_id: string | null; group_id: string | null; cohorts: { name: string } | null; groups: { name: string } | null }[];
};

/** Activities visible to the caller (RLS), optionally limited to some groups. */
export async function listActivities(groupIds?: string[]): Promise<ActivityWithAudience[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("id, title, description, starts_at, ends_at, location, cancelled_at, created_by, registration_open, capacity, mode, activity_sessions(starts_at, ends_at), activity_links(meeting_url), activity_audiences(cohort_id, group_id, cohorts(name), groups(name))")
    .order("starts_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as ActivityWithAudience[];
  return groupIds ? rows.filter((a) => a.activity_audiences.some((au) => au.group_id && groupIds.includes(au.group_id))) : rows;
}

export function toDraft(a: ActivityWithAudience, timeZone: string): ActivityDraft {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    sessions: [...a.activity_sessions]
      .sort((x, y) => x.starts_at.localeCompare(y.starts_at))
      .map((s) => ({ startsAt: utcToZonedLocal(s.starts_at, timeZone), endsAt: s.ends_at ? utcToZonedLocal(s.ends_at, timeZone) : "" })),
    location: a.location,
    registrationOpen: a.registration_open,
    capacity: a.capacity,
    mode: a.mode,
    meetingUrl: a.activity_links?.meeting_url ?? "",
    groupIds: a.activity_audiences.flatMap((au) => (au.group_id ? [au.group_id] : [])),
    cohortId: a.activity_audiences.find((au) => au.cohort_id)?.cohort_id ?? null,
  };
}
