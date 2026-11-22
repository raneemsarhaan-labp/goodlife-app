import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { CopyPreviousHabits } from "@/components/features/plan/CopyPreviousHabits";
import { CurrentState } from "@/components/features/plan/CurrentState";
import { DesiredState } from "@/components/features/plan/DesiredState";
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
  const data = await getPlan();
  if (!data) {
    return (
      <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Card><p>{(await getTranslations("today"))("noJourney")}</p></Card>
      </main>
    );
  }
  const isEmpty = !data.plan.current_state && !data.plan.desired_state && data.areas.length === 0;
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-ink-700">{t("intro")}</p>
        {!isEmpty && <LastUpdated at={data.plan.updated_at} timeZone={user.timeZone} />}
      </header>
      {isEmpty && <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />}
      {data.habits.length === 0 && data.previousHabitCount > 0 && <CopyPreviousHabits count={data.previousHabitCount} />}
      <DesiredState value={data.plan.desired_state} />
      <CurrentState value={data.plan.current_state} />
      <FocusAreaList areas={data.areas} />
      <HabitsByArea areas={data.areas} habits={data.habits} />
    </main>
  );
}
