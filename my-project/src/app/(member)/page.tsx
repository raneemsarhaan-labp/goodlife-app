import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChallengeCards } from "@/components/features/today/ChallengeCards";
import { EmptyHabits } from "@/components/features/today/EmptyHabits";
import { Greeting } from "@/components/features/today/Greeting";
import { HabitList } from "@/components/features/today/HabitList";
import { JourneyEnded } from "@/components/features/today/JourneyEnded";
import { UpcomingActivities } from "@/components/features/today/UpcomingActivities";
import { DayRollover } from "@/components/features/today/useDayRollover";
import { buttonClass } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/server/auth";
import { getToday } from "@/server/queries/today";

export const metadata = { title: "يومك" };

/** «يومك»: the member's home screen (US1, FR-010–FR-014). */
export default async function TodayPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const user = await requireUser();
  const which = (await searchParams).day === "yesterday" ? "yesterday" : "today";
  const data = await getToday(which);
  const t = await getTranslations("today");
  const isToday = which === "today";

  if (!data || data.journey_status === "none") {
    return (
      <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
        <h1 className="text-2xl font-semibold">{t("pageTitle")}</h1>
        <Card>
          <p>{t("noJourney")}</p>
        </Card>
      </main>
    );
  }

  const habits = data.habits ?? [];
  const closed = Boolean(data.day?.closed_at);

  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <DayRollover timeZone={data.time_zone} shownDate={isToday ? data.local_date : ""} />
      <Greeting name={user.fullName} timeZone={data.time_zone} localDate={data.local_date} journeyDay={data.journey_status === "active" ? data.journey_day : undefined} />

      {data.journey_status === "ended" && <JourneyEnded />}
      {data.journey_status === "not_started" && data.cohort && (
        <Card>
          <p>{t("journeyNotStarted", { date: formatDate(data.cohort.start_date, { withYear: true }) })}</p>
        </Card>
      )}

      {data.journey_status === "active" && (
        <>
          <nav aria-label={t("habits")} className="flex gap-2">
            {(["today", "yesterday"] as const).map((d) => (
              <Link
                key={d}
                href={d === "today" ? "/" : "/?day=yesterday"}
                aria-current={which === d ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm ${which === d ? "bg-ink-900 text-white" : "bg-white text-ink-700 ring-1 ring-sand-200"}`}
              >
                {t(d === "today" ? "todayTab" : "yesterdayTab")}
              </Link>
            ))}
          </nav>

          {isToday &&
            (data.day?.intention ? (
              <Card aria-labelledby="intention">
                <CardTitle id="intention" className="text-base text-ink-700">
                  {t("intention")}
                </CardTitle>
                <p className="mt-1 text-lg">{data.day.intention}</p>
                {!closed && (
                  <Link href="/day/start" className="mt-2 inline-block text-sm text-sage-700 underline underline-offset-4">
                    {t("editIntention")}
                  </Link>
                )}
              </Card>
            ) : (
              !closed && (
                <Link href="/day/start" className={`${buttonClass("primary")} flex-col py-3`}>
                  <span>{t("startDay")}</span>
                  <span className="text-sm font-normal opacity-90">{t("startDayHint")}</span>
                </Link>
              )
            ))}

          <Card aria-labelledby="habits" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle id="habits">{t("habits")}</CardTitle>
              {habits.length > 0 && isToday && (
                <Link href="/habits/new" className="text-sm text-sage-700 underline underline-offset-4">
                  {t("addHabit")}
                </Link>
              )}
            </div>
            {!isToday && <p className="text-sm text-ink-700">{t("yesterdayNote")}</p>}
            {habits.length === 0 ? <EmptyHabits /> : <HabitList key={data.local_date} habits={habits} localDate={data.local_date} />}
          </Card>

          {isToday && (
            <>
              <ChallengeCards journey={data.journey_challenge ?? null} own={data.own_challenge ?? null} localDate={data.local_date} />
              <UpcomingActivities activities={data.activities ?? []} timeZone={data.time_zone} />
              {closed ? (
                <p className="rounded-2xl bg-sage-50 p-4 text-center text-sage-700">{t("dayClosed")}</p>
              ) : (
                <Link href="/day/close" className={buttonClass("secondary")}>
                  {t("closeDay")}
                </Link>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
