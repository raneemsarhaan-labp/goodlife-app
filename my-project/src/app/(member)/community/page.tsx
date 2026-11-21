import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { GroupHeader } from "@/components/features/community/GroupHeader";
import { MemberList } from "@/components/features/community/MemberList";
import { ReceivedList } from "@/components/features/community/ReceivedList";
import { Card } from "@/components/ui/Card";
import { requireUser } from "@/server/auth";
import { getMyGroup, getReceivedEncouragements } from "@/server/queries/community";

export const generateMetadata = pageTitle("community");

/** «المجتمع» (US6, FR-040/041). */
export default async function CommunityPage() {
  const user = await requireUser();
  const [t, group, received] = await Promise.all([getTranslations("community"), getMyGroup(user.id, user.timeZone), getReceivedEncouragements()]);
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-ink-700">{t("intro")}</p>
      </header>
      {!group ? (
        <Card><p>{t("noGroup")}</p></Card>
      ) : (
        <>
          <GroupHeader groupName={group.groupName} cohortName={group.cohortName} facilitators={group.facilitators} />
          <MemberList members={group.members} phrases={group.phrases} encouragedToday={group.encouragedToday} />
        </>
      )}
      <ReceivedList items={received} />
    </main>
  );
}
