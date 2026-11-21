import { getTranslations } from "next-intl/server";
import { NewHabitForm } from "@/components/features/today/NewHabitForm";
import { Sheet } from "@/components/ui/Sheet";
import { getFocusAreas } from "@/server/queries/plan";

export const metadata = { title: "عادة جديدة" };

export default async function NewHabitPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; area?: string }> }) {
  const [{ returnTo, area }, t, areas] = await Promise.all([searchParams, getTranslations("habits"), getFocusAreas()]);
  return (
    <Sheet title={t("newTitle")}>
      <NewHabitForm areas={areas} returnTo={returnTo === "plan" ? "plan" : undefined} defaultAreaId={area} />
    </Sheet>
  );
}
