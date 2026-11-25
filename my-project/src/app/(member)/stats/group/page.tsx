import { pageTitle } from "@/i18n/metadata";
import { TogetherView } from "@/components/features/together/TogetherView";
import { requireUser } from "@/server/auth";
import { getScreenDay } from "@/server/queries/header";
import { getMyChallenges, getTogether } from "@/server/queries/together";

export const generateMetadata = pageTitle("statsGroup");

/** «مجموعتي» (spec 007 US1): the group, peers on the same habit, what you show, the running challenge. */
export default async function GroupTogetherPage() {
  const user = await requireUser();
  const [data, challenges, day] = await Promise.all([getTogether(), getMyChallenges(), getScreenDay(user.id, user.timeZone)]);
  const header = { name: user.fullName, timeZone: user.timeZone, localDate: day.localDate, journeyDay: day.journeyDay };
  return <TogetherView header={header} data={data} challenge={challenges.find((c) => c.status === "active") ?? null} />;
}
