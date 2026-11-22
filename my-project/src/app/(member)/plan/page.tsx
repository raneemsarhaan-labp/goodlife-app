import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { CopyPreviousHabits } from "@/components/features/plan/CopyPreviousHabits";
import { CurrentState } from "@/components/features/plan/CurrentState";
import { DesiredState } from "@/components/features/plan/DesiredState";
import { DomainCards } from "@/components/features/plan/DomainCards";
import { IdentityCard } from "@/components/features/plan/IdentityCard";
import { ReviewDueCard } from "@/components/features/plan/ReviewDueCard";
import { localDate } from "@/lib/journey";
import { planReviewDue } from "@/lib/plan-review";
import { getDomains } from "@/server/queries/domains";
import { FocusAreaList } from "@/components/features/plan/FocusAreaList";
import { HabitsByArea } from "@/components/features/plan/HabitsByArea";
import { LastUpdated } from "@/components/features/plan/LastUpdated";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireUser } from "@/server/auth";
import { getPlan } from "@/server/queries/plan";

export const generateMetadata = pageTitle("plan");

/** «خطتي» (US3, FR-020–FR-024). */
export default async function PlanPage() {
  const user = await requireUser();
  const t = await getTranslations("plan");
  const [data, domains] = await Promise.all([getPlan(), getDomains({ includeInactive: true })]);
  if (!data) {
    return (
      <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Card><p>{(await getTranslations("today"))("noJourney")}</p></Card>
      </main>
    );
  }
  const isEmpty = !data.plan.current_state && !data.plan.desired_state && !data.plan.identity && data.areas.length === 0;
  const today = localDate(user.timeZone);
  const reviewDue = planReviewDue(data.plan.next_review_on, localDate(user.timeZone, new Date(data.plan.created_at)), today);
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-ink-700">{t("intro")}</p>
        {!isEmpty && <LastUpdated at={data.plan.updated_at} timeZone={user.timeZone} />}
      </header>
      {isEmpty && <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />}
      {data.habits.length === 0 && data.previousHabitCount > 0 && <CopyPreviousHabits count={data.previousHabitCount} />}
      {reviewDue && <ReviewDueCard nextReviewOn={data.plan.next_review_on} />}
      <IdentityCard value={data.plan.identity} />
      <DesiredState value={data.plan.desired_state} />
      <DomainCards areas={data.areas} habits={data.habits} domains={domains} />
      <CurrentState value={data.plan.current_state} />
      <FocusAreaList areas={data.areas.filter((a) => !a.domain_id)} />
      <HabitsByArea areas={data.areas} habits={data.habits} />
    </main>
  );
}
