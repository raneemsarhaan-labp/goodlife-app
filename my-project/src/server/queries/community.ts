import "server-only";
import { localDate } from "@/lib/journey";
import { createClient } from "@/lib/supabase/server";

export type Peer = { user_id: string; full_name: string; role: "member" | "facilitator"; group_id: string };

/** The caller's group (as member) with its cohort, peers, and who they already encouraged today. */
export async function getMyGroup(userId: string, timeZone: string) {
  const supabase = await createClient();
  const [{ data: membership }, { data: peers }, { data: sentToday }, { data: phrases }] = await Promise.all([
    supabase
      .from("group_memberships")
      .select("group_id, groups(name, cohorts(name))")
      .eq("user_id", userId)
      .eq("role", "member")
      .is("ended_on", null)
      .maybeSingle(),
    supabase.rpc("group_peers"),
    supabase.from("encouragements").select("recipient_id").eq("sender_id", userId).eq("local_date", localDate(timeZone)),
    supabase.from("encouragement_phrases").select("id, text").eq("active", true).order("sort_order"),
  ]);
  if (!membership) return null;
  const groupPeers = ((peers ?? []) as Peer[]).filter((p) => p.group_id === membership.group_id);
  return {
    groupId: membership.group_id,
    groupName: membership.groups?.name ?? "",
    cohortName: membership.groups?.cohorts?.name ?? "",
    facilitators: groupPeers.filter((p) => p.role === "facilitator"),
    members: groupPeers.filter((p) => p.role === "member"),
    encouragedToday: new Set((sentToday ?? []).map((e) => e.recipient_id)),
    phrases: phrases ?? [],
  };
}

export async function getReceivedEncouragements() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("received_encouragements", { p_limit: 30 });
  return data ?? [];
}

/** «مجموعاتي»: groups the user leads and the group they belong to (FR-042). */
export async function getMyGroups(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_memberships")
    .select("role, group_id, groups(name, cohorts(name))")
    .eq("user_id", userId)
    .is("ended_on", null);
  return (data ?? []).map((m) => ({
    groupId: m.group_id,
    role: m.role,
    groupName: m.groups?.name ?? "",
    cohortName: m.groups?.cohorts?.name ?? "",
  }));
}
