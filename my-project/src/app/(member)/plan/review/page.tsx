import { pageTitle } from "@/i18n/metadata";
import { redirect } from "next/navigation";
import { Fragment } from "react";
import { getTranslations } from "next-intl/server";
import { DesiredState } from "@/components/features/plan/DesiredState";
import { DomainCards } from "@/components/features/plan/DomainCards";
import { IdentityCard } from "@/components/features/plan/IdentityCard";
import { PlanReviewStepper } from "@/components/features/plan/PlanReviewStepper";
import { Sheet } from "@/components/ui/Sheet";
import { localDate } from "@/lib/journey";
import { requireUser } from "@/server/auth";
import { getDomains } from "@/server/queries/domains";
import { getPlan } from "@/server/queries/plan";

export const generateMetadata = pageTitle("planReview");

/** «من أنت وما تريد»: the member's plan review (spec 005 US3). */
export default async function PlanReviewPage() {
  const user = await requireUser();
  const [data, domains, t] = await Promise.all([getPlan(), getDomains({ includeInactive: true }), getTranslations("planReview")]);
  if (!data) redirect("/plan");
  return (
    <Sheet title={t("title")}>
      <PlanReviewStepper
        today={localDate(user.timeZone)}
        steps={[
          <Fragment key="texts">
            <IdentityCard value={data.plan.identity} />
            <DesiredState value={data.plan.desired_state} />
          </Fragment>,
          <DomainCards key="domains" areas={data.areas} habits={data.habits} domains={domains} />,
        ]}
      />
    </Sheet>
  );
}
