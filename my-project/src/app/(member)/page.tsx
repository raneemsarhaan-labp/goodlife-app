import { pageTitle } from "@/i18n/metadata";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TodayView } from "@/components/features/today/TodayView";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher";
import { requireUser } from "@/server/auth";
import { getToday } from "@/server/queries/today";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingStatus } from "@/server/queries/onboarding";

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
      <main id="main" className="td-page">
        <header className="td-header">
          <h1 className="td-title">{t("pageTitle")}</h1>
        </header>
        <div className="td-content">
          <section className="td-card">
            <p className="td-empty-body">{t("noJourney")}</p>
          </section>
          <RoleSwitcher roles={user.roles} active={user.activeRole} />
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const [{ data: ritualData }, onboarding] = await Promise.all([
    isToday ? supabase.rpc("today_ritual") : Promise.resolve({ data: null }),
    isToday ? getOnboardingStatus() : Promise.resolve(null),
  ]);
  // «خطوات البداية» until the first steps are done (or hidden); it carries «شكل التطبيق» too.
  const showOnboarding = Boolean(onboarding && !onboarding.dismissed && data.journey_status !== "ended");
  const ritual = (ritualData as { show: boolean; quote: { text: string; source: string | null } | null } | null) ?? { show: false, quote: null };

  return <TodayView user={user} data={data} isToday={isToday} ritual={ritual} onboarding={showOnboarding ? onboarding : null} />;
}
