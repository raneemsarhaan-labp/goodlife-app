import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { PlanHeader } from "@/components/features/plan/PlanHeader";
import { PlanView } from "@/components/features/plan/PlanView";
import { localDate } from "@/lib/journey";
import { planReviewDue } from "@/lib/plan-review";
import { getDomains } from "@/server/queries/domains";
import { requireUser } from "@/server/auth";
import { getPlan } from "@/server/queries/plan";
import { getToday } from "@/server/queries/today";

export const generateMetadata = pageTitle("plan");

/** «خطتي» (US3, FR-020–FR-024; spec 005), as the Glass Edition draws «خطتك». */
export default async function PlanPage() {
  const user = await requireUser();
  const t = await getTranslations("plan");
  const [data, domains, day] = await Promise.all([getPlan(), getDomains({ includeInactive: true }), getToday("today").catch(() => null)]);
  const today = localDate(user.timeZone);
  const journeyDay = day?.journey_status === "active" ? day.journey_day : null;
  if (!data) {
    return (
      <main id="main" className="pn-page">
        <PlanHeader title={t("heading")} name={user.fullName} timeZone={user.timeZone} localDate={today} journeyDay={journeyDay} />
        <div className="pn-content">
          <section className="pn-card">
            <p className="pn-empty-text">{(await getTranslations("today"))("noJourney")}</p>
          </section>
        </div>
      </main>
    );
  }
  const reviewDue = planReviewDue(data.plan.next_review_on, localDate(user.timeZone, new Date(data.plan.created_at)), today);
  return (
    <PlanView
      user={user}
      today={today}
      journeyDay={journeyDay}
      plan={data.plan}
      areas={data.areas}
      habits={data.habits}
      previousHabitCount={data.previousHabitCount}
      domains={domains}
      reviewDue={reviewDue}
    />
  );
}
