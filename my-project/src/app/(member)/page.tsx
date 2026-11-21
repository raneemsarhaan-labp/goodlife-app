import { pageTitle } from "@/i18n/metadata";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EmptyHabits } from "@/components/features/today/EmptyHabits";
import { Greeting } from "@/components/features/today/Greeting";
import { JourneyEnded } from "@/components/features/today/JourneyEnded";
import { ReviewPrompt } from "@/components/features/today/ReviewPrompt";
import { DayRollover } from "@/components/features/today/useDayRollover";
import { buttonClass } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher";
import { InstallHint } from "@/components/features/install/InstallHint";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/server/auth";
import { getToday } from "@/server/queries/today";
import { createClient } from "@/lib/supabase/server";
import { ChooseLookCard } from "@/ui/components/ChooseLookCard";
import { TodayIslandClient } from "@/ui/views/TodayIsland.client";

export const generateMetadata = pageTitle("today");

/** «يومك»: the member's home screen (US1, FR-010–FR-014). */
export default async function TodayPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const user = await requireUser();
  if (user.activeRole === "admin" && user.roles.includes("admin")) redirect("/admin");
  if (user.activeRole === "facilitator" && user.roles.includes("facilitator")) redirect("/groups");
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
        <RoleSwitcher roles={user.roles} active={user.activeRole} />
      </main>
    );
  }

  const habits = data.habits ?? [];
  const supabase = await createClient();
  const { data: ritualData } = isToday ? await supabase.rpc("today_ritual") : { data: null };
  const ritual = (ritualData as { show: boolean; quote: { text: string; source: string | null } | null } | null) ?? { show: false, quote: null };

  const closed = Boolean(data.day?.closed_at);

  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <DayRollover timeZone={data.time_zone} shownDate={isToday ? data.local_date : ""} />
      <RoleSwitcher roles={user.roles} active={user.activeRole} />
      {!user.uiChosenAt && <ChooseLookCard />}
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
                className={`rounded-full px-4 py-2 text-sm ${which === d ? "bg-ink-900 text-white" : "gl-surface text-ink-700 ring-1 ring-sand-200"}`}
              >
                {t(d === "today" ? "todayTab" : "yesterdayTab")}
              </Link>
            ))}
          </nav>

          {isToday && data.review_prompt && <ReviewPrompt month={data.review_prompt} />}

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

          {habits.length === 0 && (
            <Card aria-labelledby="habits" className="flex flex-col gap-3">
              <CardTitle id="habits">{t("habits")}</CardTitle>
              <EmptyHabits />
            </Card>
          )}
          {!isToday && <p className="text-sm text-ink-700">{t("yesterdayNote")}</p>}
          <TodayIslandClient data={data} isToday={isToday} ritual={ritual} />

          {isToday && (
            <>
              <InstallHint />
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
