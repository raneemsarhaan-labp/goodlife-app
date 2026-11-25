import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { HabitEditForm } from "@/components/features/habits/HabitEditForm";
import { createClient } from "@/lib/supabase/server";
import { getDomains } from "@/server/queries/domains";
import { getFocusAreas } from "@/server/queries/plan";

export const generateMetadata = pageTitle("editHabit");

export default async function EditHabitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: habit }, { data: planId }, areas, t, domains] = await Promise.all([
    supabase.from("habits").select("id, name, description, icon, focus_area_id, plan_id, archived_at, domain_id, amount, time_of_day, days, shared_with_group, is_private, group_challenge_id").eq("id", id).maybeSingle(),
    supabase.rpc("current_plan_id"),
    getFocusAreas(),
    getTranslations("habits"),
    getDomains(),
  ]);
  if (!habit || habit.plan_id !== planId || habit.archived_at) notFound();
  return (
    <main id="main" aria-label={t("editTitle")}>
      <HabitEditForm habit={habit} areas={areas} domains={domains} />
    </main>
  );
}
