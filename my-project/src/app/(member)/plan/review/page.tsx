import { pageTitle } from "@/i18n/metadata";
import { redirect } from "next/navigation";
import { PlanReviewView } from "@/components/features/plan/PlanReviewView";
import { localDate } from "@/lib/journey";
import { requireUser } from "@/server/auth";
import { getDomains } from "@/server/queries/domains";
import { getPlan } from "@/server/queries/plan";

export const generateMetadata = pageTitle("planReview");

/** «من أنت وما تريد»: the member's plan review (spec 005 US3). */
export default async function PlanReviewPage() {
  const user = await requireUser();
  const [data, domains] = await Promise.all([getPlan(), getDomains({ includeInactive: true })]);
  if (!data) redirect("/plan");
  return <PlanReviewView today={localDate(user.timeZone)} plan={data.plan} areas={data.areas} domains={domains} />;
}
