import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { LifeDomain } from "@/server/queries/domains";
import type { FocusArea, PlanHabit } from "@/server/queries/plan";
import { icon } from "@/ui/icons";
import { Icon } from "@/ui/components/Icon";
import { CopyPreviousHabits } from "./CopyPreviousHabits";
import { CurrentState } from "./CurrentState";
import { DesiredState } from "./DesiredState";
import { DomainCards } from "./DomainCards";
import { FocusAreaList } from "./FocusAreaList";
import { HabitsByArea } from "./HabitsByArea";
import { IdentityCard } from "./IdentityCard";
import { LastUpdated } from "./LastUpdated";
import { PlanHeader } from "./PlanHeader";
import { ReviewDueCard } from "./ReviewDueCard";

export type PlanViewProps = {
  user: { fullName: string; timeZone: string };
  today: string;
  journeyDay?: number | null;
  plan: { current_state: string; desired_state: string; identity: string; next_review_on: string | null; updated_at: string };
  areas: FocusArea[];
  habits: PlanHabit[];
  previousHabitCount: number;
  domains: LifeDomain[];
  reviewDue: boolean;
};

/**
 * «خطتك» as designed (header, «حان موعد مراجعتك», «وصف حالي المنشود», «هويّتي», «مجالات عملي هذه
 * السنة»), then the plan's own parts in the same style: «واقعي الآن», habits by domain, other areas.
 * Shared by the page and the development preview.
 */
export async function PlanView({ user, today, journeyDay, plan, areas, habits, previousHabitCount, domains, reviewDue }: PlanViewProps) {
  const t = await getTranslations("plan");
  const isEmpty = !plan.current_state && !plan.desired_state && !plan.identity && areas.length === 0;
  return (
    <main id="main" className="pn-page">
      <PlanHeader title={t("heading")} name={user.fullName} timeZone={user.timeZone} localDate={today} journeyDay={journeyDay} />
      <div className="pn-content">
        {isEmpty && (
          <section aria-labelledby="plan-empty" className="pn-card">
            <h2 id="plan-empty" className="pn-label">
              {t("emptyTitle")}
            </h2>
            <p className="pn-empty-text">{t("emptyBody")}</p>
          </section>
        )}
        {habits.length === 0 && previousHabitCount > 0 && <CopyPreviousHabits count={previousHabitCount} />}
        {reviewDue && <ReviewDueCard nextReviewOn={plan.next_review_on} />}
        <DesiredState value={plan.desired_state} />
        <IdentityCard value={plan.identity} />
        <DomainCards areas={areas} habits={habits} domains={domains} />
        <CurrentState value={plan.current_state} />
        <HabitsByArea areas={areas} habits={habits} />
        <FocusAreaList areas={areas.filter((a) => !a.domain_id)} />
        {!isEmpty && <LastUpdated at={plan.updated_at} timeZone={user.timeZone} />}
      </div>
      <Link href="/habits/new?returnTo=plan" className="pn-fab" aria-label={t("addHabit")}>
        <Icon src={icon("add")} />
      </Link>
    </main>
  );
}
