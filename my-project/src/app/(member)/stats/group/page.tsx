import { pageTitle } from "@/i18n/metadata";
import { TogetherView } from "@/components/features/together/TogetherView";
import { requireUser } from "@/server/auth";
import { getTogether } from "@/server/queries/together";

export const generateMetadata = pageTitle("statsGroup");

/** «مجموعتي» (spec 007 US1): the group, peers on the same habit, and what you show. */
export default async function GroupTogetherPage() {
  await requireUser();
  const data = await getTogether();
  return <TogetherView data={data} />;
}
