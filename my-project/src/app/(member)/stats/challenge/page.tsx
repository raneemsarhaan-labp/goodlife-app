import { pageTitle } from "@/i18n/metadata";
import { ChallengeListView } from "@/components/features/together/ChallengeListView";
import { requireUser } from "@/server/auth";
import { getMyChallenges } from "@/server/queries/together";

export const generateMetadata = pageTitle("statsChallenge");

/** «التحدّي» (spec 007 US2): own progress and group counts — never a ranking (FR-083). */
export default async function ChallengePage() {
  await requireUser();
  const challenges = await getMyChallenges();
  return <ChallengeListView challenges={challenges} />;
}
