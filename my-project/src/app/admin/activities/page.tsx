import { nowMs } from "@/lib/clock";
import { getTranslations } from "next-intl/server";
import { ActivityForm } from "@/components/features/admin/ActivityForm";
import { ActivityList } from "@/components/features/admin/ActivityList";
import { Card, CardTitle } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/auth";
import { listActivities, toDraft } from "@/server/queries/activities";

export const metadata = { title: "الأنشطة" };

export default async function AdminActivitiesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const user = await requireRole("admin");
  const { edit } = await searchParams;
  const t = await getTranslations("admin.activities");
  const supabase = await createClient();
  const [{ data: groups }, { data: cohorts }, activities] = await Promise.all([
    supabase.from("groups").select("id, name, cohorts(name)").order("name"),
    supabase.from("cohorts").select("id, name").order("start_date", { ascending: false }),
    listActivities(),
  ]);
  const editing = edit ? activities.find((a) => a.id === edit) : undefined;
  const now = nowMs();
  const rows = activities.map((a) => {
    const cohort = a.activity_audiences.find((au) => au.cohort_id);
    return {
      ...a,
      editable: true,
      audience: cohort
        ? t("forCohort", { name: cohort.cohorts?.name ?? "" })
        : t("forGroups", { names: a.activity_audiences.map((au) => au.groups?.name).filter(Boolean).join("، ") }),
    };
  });
  const upcoming = rows.filter((a) => new Date(a.starts_at).getTime() >= now).reverse();
  const past = rows.filter((a) => new Date(a.starts_at).getTime() < now);

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-ink-700">{t("intro")}</p>
      <Card aria-labelledby="activity-form">
        <CardTitle id="activity-form" className="mb-3">{editing ? t("edit") : t("new")}</CardTitle>
        <ActivityForm
          key={editing?.id ?? "new"}
          draft={editing ? toDraft(editing, user.timeZone) : {}}
          groups={(groups ?? []).map((g) => ({ id: g.id, label: `${g.cohorts?.name ?? ""} — ${g.name}` }))}
          cohorts={cohorts ?? []}
          allowCohort
          timeZone={user.timeZone}
        />
      </Card>
      <section aria-labelledby="upcoming-activities" className="flex flex-col gap-3">
        <h2 id="upcoming-activities" className="text-xl font-semibold">{t("upcoming")}</h2>
        <ActivityList rows={upcoming} timeZone={user.timeZone} editHref={(id) => `/admin/activities?edit=${id}`} />
      </section>
      <section aria-labelledby="past-activities" className="flex flex-col gap-3">
        <h2 id="past-activities" className="text-xl font-semibold">{t("past")}</h2>
        <ActivityList rows={past.slice(0, 30)} timeZone={user.timeZone} editHref={(id) => `/admin/activities?edit=${id}`} />
      </section>
    </>
  );
}
