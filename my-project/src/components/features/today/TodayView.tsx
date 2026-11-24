import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EmptyHabits } from "@/components/features/today/EmptyHabits";
import { Greeting } from "@/components/features/today/Greeting";
import { JourneyEnded } from "@/components/features/today/JourneyEnded";
import { ReviewPrompt } from "@/components/features/today/ReviewPrompt";
import { DayRollover } from "@/components/features/today/useDayRollover";
import { DesiredStateCard } from "@/components/features/today/DesiredStateCard";
import { RegisteredActivityCard } from "@/components/features/today/RegisteredActivityCard";
import { isActivityCardVisible } from "@/lib/activity-card";
import { ReviewDueCard } from "@/components/features/plan/ReviewDueCard";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher";
import { InstallHint } from "@/components/features/install/InstallHint";
import { formatDate } from "@/lib/format";
import type { AppRole } from "@/server/auth";
import type { TodayData } from "@/server/queries/today";
import type { OnboardingStatus } from "@/server/queries/onboarding";
import { ChooseLookCard } from "@/ui/components/ChooseLookCard";
import { OnboardingCard } from "@/components/features/onboarding/OnboardingCard";
import { TodayIslandClient } from "@/ui/views/TodayIsland.client";

export type TodayViewProps = {
  user: { fullName: string; roles: AppRole[]; activeRole: AppRole; uiChosenAt: string | null };
  data: TodayData;
  isToday: boolean;
  ritual: { show: boolean; quote: { text: string; source: string | null } | null };
  /** «خطوات البداية», when it should show. */
  onboarding: OnboardingStatus | null;
};

/**
 * «يومك» as designed (header, «حالي المنشود», registered activities, «عاداتي اليومية», «تقدمك اليوم»,
 * «تحدّي اليوم»), plus the day's own steps (intention, closing). Shared by the page and the
 * development preview so both render the same markup.
 */
export async function TodayView({ user, data, isToday, ritual, onboarding }: TodayViewProps) {
  const t = await getTranslations("today");
  const habits = data.habits ?? [];
  const closed = Boolean(data.day?.closed_at);

  return (
    <main id="main" className="td-page">
      <Greeting name={user.fullName} timeZone={data.time_zone} localDate={data.local_date} journeyDay={data.journey_status === "active" ? data.journey_day : undefined} />
      <div className="td-content">
        <DayRollover timeZone={data.time_zone} shownDate={isToday ? data.local_date : ""} />
        <RoleSwitcher roles={user.roles} active={user.activeRole} />
        {onboarding ? <OnboardingCard status={onboarding} /> : !user.uiChosenAt && <ChooseLookCard />}
        {isToday && data.plan_review_due && <ReviewDueCard nextReviewOn={data.next_review_on ?? null} />}
        {isToday && <DesiredStateCard text={data.desired_state ?? ""} localDate={data.local_date} />}
        {isToday &&
          (data.registered_activities ?? [])
            .filter((a) => isActivityCardVisible(a, data.local_date))
            .map((a) => <RegisteredActivityCard key={a.id} activity={a} timeZone={data.time_zone} />)}

        {data.journey_status === "ended" && <JourneyEnded />}
        {data.journey_status === "not_started" && data.cohort && (
          <section className="td-card">
            <p className="td-empty-body">{t("journeyNotStarted", { date: formatDate(data.cohort.start_date, { withYear: true }) })}</p>
          </section>
        )}

        {data.journey_status === "active" && (
          <>
            {isToday && data.review_prompt && <ReviewPrompt month={data.review_prompt} />}

            {habits.length === 0 && <EmptyHabits />}
            {!isToday && <p className="td-empty-note">{t("yesterdayNote")}</p>}
            <TodayIslandClient data={data} isToday={isToday} ritual={ritual} />

            {/* The day's own steps follow the designed cards: the intention (or «ابدأ يومي»), then «ختام اليوم». */}
            {isToday &&
              (data.day?.intention ? (
                <section aria-labelledby="intention" className="td-card">
                  <h2 id="intention" className="td-label">
                    {t("intention")}
                  </h2>
                  <p className="td-intention-text">{data.day.intention}</p>
                  {!closed && (
                    <Link href="/day/start" className="td-text-button inline-flex items-center">
                      {t("editIntention")}
                    </Link>
                  )}
                </section>
              ) : (
                !closed && (
                  <Link href="/day/start" className="td-btn td-btn-primary">
                    <span>{t("startDay")}</span>
                    <span className="td-btn-hint">{t("startDayHint")}</span>
                  </Link>
                )
              ))}

            {isToday && (
              <>
                <InstallHint />
                {closed ? (
                  <p className="td-closed">{t("dayClosed")}</p>
                ) : (
                  <Link href="/day/close" className="td-btn td-btn-secondary">
                    {t("closeDay")}
                  </Link>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
