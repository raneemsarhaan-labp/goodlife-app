import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ActivityDetails = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  mode: "in_person" | "online";
  registration_open: boolean;
  capacity: number | null;
  cancelled_at: string | null;
  sessions: { starts_at: string; ends_at: string | null; past: boolean }[];
  registered_count: number;
  places_left: number | null;
  registered: boolean;
  window_open: boolean;
  can_manage: boolean;
  meeting_url: string | null;
};

export type Registrant = { user_id: string; full_name: string; group_name: string | null; registered_at: string };

/** Activity page data (spec 003 data-model.md › activity_details); null when not visible. */
export async function getActivityDetails(id: string): Promise<ActivityDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("activity_details", { p_activity: id });
  if (error || !data) return null;
  return data as unknown as ActivityDetails;
}

/** Registrants visible to the caller: all for admins, own groups' members for facilitators (FR-017). */
export async function getRegistrants(id: string): Promise<Registrant[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("activity_registrations", { p_activity: id });
  return (data ?? []) as Registrant[];
}
