import { pageTitle } from "@/i18n/metadata";
import { MoreView } from "@/components/features/more/MoreView";
import { requireUser } from "@/server/auth";
import { getScreenDay } from "@/server/queries/header";

export const generateMetadata = pageTitle("more");

/** «المزيد» (FR-082). */
export default async function MorePage() {
  const user = await requireUser();
  const day = await getScreenDay(user.id, user.timeZone);
  return (
    <MoreView
      header={{ name: user.fullName, timeZone: user.timeZone, localDate: day.localDate, journeyDay: day.journeyDay }}
      user={user}
      cohortName={day.cohortName}
    />
  );
}
