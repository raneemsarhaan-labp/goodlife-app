import { getTranslations } from "next-intl/server";
import { ScreenHeader } from "@/components/features/screens/ScreenHeader";
import type { Peer } from "@/server/queries/community";
import { ActivityListView, type CommunityItem } from "./ActivityList";
import { GroupHeader } from "./GroupHeader";
import { MemberList } from "./MemberList";
import { ReceivedList } from "./ReceivedList";

export type CommunityGroup = {
  groupName: string;
  cohortName: string;
  facilitators: Peer[];
  members: Peer[];
  phrases: { id: string; text: string }[];
  encouragedToday: Set<string>;
} | null;

/**
 * «المجتمع» (US6, spec 007 US3) as the Glass Edition draws it: the header and «أنشطة قادمة». The
 * group, encouragement and received words (not in the design) follow on the same cards. Props only.
 */
export async function CommunityView({
  header,
  items,
  group,
  encouragementOn,
  received,
}: {
  header: { name: string; timeZone: string; localDate: string; journeyDay?: number };
  items: CommunityItem[];
  group: CommunityGroup;
  encouragementOn: boolean;
  received: { id: string; sender_name: string; phrase: string; local_date: string }[];
}) {
  const t = await getTranslations("community");
  return (
    <main id="main" className="sc-page">
      <ScreenHeader title={t("title")} {...header} />
      <div className="sc-content">
        <ActivityListView items={items} timeZone={header.timeZone} />
        <div className="sc-stack">
          {!group ? (
            <section className="sc-card">
              <p className="sc-text">{t("noGroup")}</p>
            </section>
          ) : (
            <>
              <GroupHeader groupName={group.groupName} cohortName={group.cohortName} facilitators={group.facilitators} />
              {encouragementOn && <MemberList members={group.members} phrases={group.phrases} encouragedToday={group.encouragedToday} />}
            </>
          )}
          <ReceivedList items={received} />
        </div>
      </div>
    </main>
  );
}
