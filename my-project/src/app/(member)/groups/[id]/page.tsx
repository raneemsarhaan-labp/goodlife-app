import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ActivityForm } from "@/components/features/admin/ActivityForm";
import { ActivityList } from "@/components/features/admin/ActivityList";
import { PeriodTabs } from "@/components/features/stats/PeriodTabs";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatDate, formatNumber } from "@/lib/format";
import { localDate } from "@/lib/journey";
import { PERIODS, periodRange, type Period } from "@/lib/period";
import { createClient } from "@/lib/supabase/server";
import { requireGroupFacilitator } from "@/server/auth";
import { listActivities, toDraft } from "@/server/queries/activities";
import { getGroupMemberSignals, getGroupStats } from "@/server/queries/stats";

export const metadata = { title: "المجموعة" };

const pct = (r: number) => formatNumber(r, undefined, { style: "percent" });

/** Facilitator's group page: aggregates, activity signals only, and group activities (FR-037, FR-043, FR-044). */
export default async function GroupPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ period?: string; edit?: string }> }) {
  const { id } = await params;
  const user = await requireGroupFacilitator(id);
  const { period: requested, edit } = await searchParams;
  const period: Period = PERIODS.includes(requested as Period) ? (requested as Period) : "week";
  const supabase = await createClient();
  const { data: group } = await supabase.from("groups").select("id, name, cohorts(name, start_date)").eq("id", id).maybeSingle();
  if (!group?.cohorts) notFound();
  const today = localDate(user.timeZone);
  const { from, to } = periodRange(period, today, group.cohorts.start_date);
  const [t, stats, signals, activities, { data: led }] = await Promise.all([
    getTranslations("groups"),
    getGroupStats(id, from, to),
    getGroupMemberSignals(id, from, to),
    listActivities([id]),
    supabase.from("group_memberships").select("group_id, groups(name)").eq("user_id", user.id).eq("role", "facilitator").is("ended_on", null),
  ]);
  const ta = await getTranslations("admin.activities");
  const editing = edit ? activities.find((a) => a.id === edit && a.created_by === user.id) : undefined;
  const ledGroups = (led ?? []).map((g) => ({ id: g.group_id, label: g.groups?.name ?? "" }));
  const groupOptions = ledGroups.length ? ledGroups : [{ id, label: group.name }];

  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <header>
        <p className="text-sm text-ink-500">{group.cohorts.name}</p>
        <h1 className="text-2xl font-semibold">{group.name}</h1>
      </header>
      <PeriodTabs active={period} basePath={`/groups/${id}`} />

      {stats && (
        <Card aria-labelledby="group-stats" className="flex flex-col gap-1">
          <CardTitle id="group-stats" className="mb-2">{t("statsTitle")}</CardTitle>
          <p>{t("members", { count: formatNumber(stats.members) })}</p>
          <p>{t("avgCompletion", { rate: pct(Number(stats.avg_completion ?? 0)) })}</p>
          <p>{t("journeyCompletion", { rate: pct(stats.journey_possible ? stats.journey_done / stats.journey_possible : 0) })}</p>
          <p>{t("active7d", { count: formatNumber(stats.active_7d) })}</p>
        </Card>
      )}

      <Card aria-labelledby="signals" className="flex flex-col gap-3">
        <CardTitle id="signals">{t("signalsTitle")}</CardTitle>
        <p className="text-sm text-ink-500">{t("signalsHint")}</p>
        <ul className="flex flex-col gap-3">
          {signals.map((s) => (
            <li key={s.user_id} className="flex flex-col rounded-xl bg-sand-50 px-4 py-2">
              <span className="font-medium">{s.full_name}</span>
              <span className="text-sm text-ink-700">{s.last_active ? t("lastActive", { date: formatDate(s.last_active) }) : t("neverActive")}</span>
              <span className="text-sm text-ink-700">
                {t("daysClosed", { count: formatNumber(s.days_closed) })} · {t("completion", { rate: pct(s.completion_rate) })}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card aria-labelledby="group-activities" className="flex flex-col gap-4">
        <CardTitle id="group-activities">{t("activitiesTitle")}</CardTitle>
        <ActivityList
          rows={activities.map((a) => ({ ...a, editable: a.created_by === user.id, audience: "" }))}
          timeZone={user.timeZone}
          editHref={(aid) => `/groups/${id}?edit=${aid}`}
        />
        <h3 className="font-medium">{editing ? ta("edit") : t("newActivity")}</h3>
        <ActivityForm
          key={editing?.id ?? "new"}
          draft={editing ? toDraft(editing, user.timeZone) : { groupIds: [id] }}
          groups={groupOptions}
          cohorts={[]}
          allowCohort={user.roles.includes("admin")}
          timeZone={user.timeZone}
        />
      </Card>
    </main>
  );
}
