import { pageTitle } from "@/i18n/metadata";
import type { CommunityItem } from "@/components/features/community/ActivityList";
import { CommunityView } from "@/components/features/community/CommunityView";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth";
import { getMyGroup, getReceivedEncouragements } from "@/server/queries/community";
import { getScreenDay } from "@/server/queries/header";

export const generateMetadata = pageTitle("community");

/** «المجتمع» (US6, FR-040/041; spec 007 US3). */
export default async function CommunityPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [group, received, day, { data: activities }] = await Promise.all([
    getMyGroup(user.id, user.timeZone),
    getReceivedEncouragements(),
    getScreenDay(user.id, user.timeZone),
    supabase.rpc("community_activities"),
  ]);
  // Spec 007 FR-007: the admin may turn encouragement off for the group.
  const { data: groupRow } = group ? await supabase.from("groups").select("features").eq("id", group.groupId).maybeSingle() : { data: null };
  const encouragementOn = (groupRow?.features as Record<string, boolean> | undefined)?.encouragement !== false;
  return (
    <CommunityView
      header={{ name: user.fullName, timeZone: user.timeZone, localDate: day.localDate, journeyDay: day.journeyDay }}
      items={(activities ?? []) as unknown as CommunityItem[]}
      group={group}
      encouragementOn={encouragementOn}
      received={received}
    />
  );
}
