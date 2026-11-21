import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { grantAdmin, revokeAdmin } from "@/server/actions/admin/structure";

export const metadata = { title: "لوحة الإدارة" };

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
    </>
  );
}
