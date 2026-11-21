import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { processAccountDeletion } from "@/server/actions/account";
import { grantAdmin, revokeAdmin } from "@/server/actions/admin/structure";
import { formatDate as fmtDate } from "@/lib/format";
import { localDate } from "@/lib/journey";
import { requireRole } from "@/server/auth";

export const generateMetadata = pageTitle("admin");

export default async function AdminHome() {
  const t = await getTranslations("admin");
  const supabase = await createClient();
  const count = async (q: PromiseLike<{ count: number | null }>) => formatNumber((await q).count ?? 0);
  const [cohorts, groups, members, facilitators] = await Promise.all([
    count(supabase.from("cohorts").select("*", { count: "exact", head: true })),
    count(supabase.from("groups").select("*", { count: "exact", head: true })),
    count(supabase.from("group_memberships").select("*", { count: "exact", head: true }).eq("role", "member").is("ended_on", null)),
    count(supabase.from("group_memberships").select("*", { count: "exact", head: true }).eq("role", "facilitator").is("ended_on", null)),
  ]);
  const { data: admins } = await supabase.from("user_roles").select("user_id, users(full_name, email)").eq("role", "admin");
  const me = await requireRole("admin");
  const { data: deletions } = await supabase.from("users").select("id, full_name, email, deletion_requested_at").not("deletion_requested_at", "is", null).order("deletion_requested_at");

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-ink-700">{t("home.intro")}</p>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["cohorts", cohorts],
          ["groups", groups],
          ["members", members],
          ["facilitators", facilitators],
        ].map(([key, value]) => (
          <Card key={key} className="flex flex-col gap-1">
            <dt className="text-sm text-ink-700">{t(`home.${key}`)}</dt>
            <dd className="text-2xl font-semibold">{value}</dd>
          </Card>
        ))}
      </dl>
      <Card aria-labelledby="admins" className="flex flex-col gap-4">
        <CardTitle id="admins">{t("home.admins")}</CardTitle>
        <ul className="flex flex-col gap-2">
          {(admins ?? []).map((a) => (
            <li key={a.user_id} className="flex items-center justify-between gap-3">
              <span>
                {a.users?.full_name} <span className="text-sm text-ink-500" dir="ltr">{a.users?.email}</span>
              </span>
              <form action={revokeAdmin}>
                <input type="hidden" name="userId" value={a.user_id} />
                <Button type="submit" variant="quiet">{t("home.revoke")}</Button>
              </form>
            </li>
          ))}
        </ul>
        <ActionForm action={grantAdmin} submitLabel={t("home.grant")} resetOnSuccess successText={t("saved")}>
          <Field name="email" type="email" dir="ltr" label={t("home.grantAdmin")} required />
        </ActionForm>
      </Card>
      <Card aria-labelledby="deletions" className="flex flex-col gap-3">
        <CardTitle id="deletions">{t("home.deletionTitle")}</CardTitle>
        {(deletions ?? []).length === 0 && <p className="text-ink-500">{t("home.noDeletion")}</p>}
        <ul className="flex flex-col gap-2">
          {(deletions ?? []).map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {d.full_name} <span dir="ltr" className="text-sm text-ink-500">{d.email}</span>
                <span className="block text-sm text-ink-500">
                  {t("home.requestedOn", { date: fmtDate(localDate(me.timeZone, new Date(d.deletion_requested_at!)), { withYear: true }) })}
                </span>
              </span>
              <form action={processAccountDeletion}>
                <input type="hidden" name="userId" value={d.id} />
                <Button type="submit" variant="secondary">{t("home.processDeletion")}</Button>
              </form>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
