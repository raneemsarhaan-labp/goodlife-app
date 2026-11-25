import { pageTitle } from "@/i18n/metadata";
import { ChallengeListView } from "@/components/features/together/ChallengeListView";
import { requireUser } from "@/server/auth";
import { getScreenDay } from "@/server/queries/header";
import { getMyChallenges } from "@/server/queries/together";

export const generateMetadata = pageTitle("statsChallenge");

/** «التحدّي» (spec 007 US2): own progress and group counts — never a ranking (FR-083). */
export default async function ChallengePage() {
  const user = await requireUser();
  const [challenges, day] = await Promise.all([getMyChallenges(), getScreenDay(user.id, user.timeZone)]);
  return <ChallengeListView header={{ name: user.fullName, timeZone: user.timeZone, localDate: day.localDate, journeyDay: day.journeyDay }} challenges={challenges} />;
}
