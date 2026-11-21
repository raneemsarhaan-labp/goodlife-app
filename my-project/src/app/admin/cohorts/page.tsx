import { pageTitle } from "@/i18n/metadata";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { formatDate, formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { upsertCohort } from "@/server/actions/admin/structure";

export const generateMetadata = pageTitle("adminCohorts");

export default async function CohortsPage() {
  const t = await getTranslations("admin");
  const supabase = await createClient();
  const { data: cohorts } = await supabase
    .from("cohorts")
    .select("id, name, start_date, end_date, groups(id, group_memberships(role, ended_on))")
    .order("start_date", { ascending: false });

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("cohorts.title")}</h1>
      {(cohorts ?? []).length === 0 ? (
        <EmptyState title={t("cohorts.none")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {(cohorts ?? []).map((c) => {
            const members = c.groups.flatMap((g) => g.group_memberships).filter((m) => m.role === "member" && !m.ended_on).length;
            return (
              <li key={c.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{c.name}</h2>
                    <p className="text-sm text-ink-700">
                      {t("cohorts.dates", { start: formatDate(c.start_date, { withYear: true, withWeekday: false }), end: formatDate(c.end_date ?? c.start_date, { withYear: true, withWeekday: false }) })}
                    </p>
                    <p className="text-sm text-ink-500">
                      {t("cohorts.groupsCount", { count: c.groups.length, n: formatNumber(c.groups.length) })} · {t("cohorts.membersCount", { count: members, n: formatNumber(members) })}
                    </p>
                  </div>
                  <Link href={`/admin/cohorts/${c.id}`} className="text-sage-700 underline underline-offset-4">
                    {t("cohorts.open")}
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      <Card aria-labelledby="new-cohort">
        <CardTitle id="new-cohort" className="mb-3">{t("cohorts.new")}</CardTitle>
        <ActionForm action={upsertCohort} submitLabel={t("cohorts.create")} resetOnSuccess successText={t("saved")} fieldErrors={{ "name:conflict": t("cohorts.nameTaken") }}>
          <Field name="name" label={t("cohorts.name")} placeholder={t("cohorts.namePlaceholder")} required minLength={2} maxLength={80} />
          <Field name="startDate" type="date" label={t("cohorts.startDate")} hint={t("cohorts.startDateHint")} required />
        </ActionForm>
      </Card>
    </>
  );
}
