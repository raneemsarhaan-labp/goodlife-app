import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ui/ActionForm";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/server";
import { addMember, assignFacilitator, moveMember, removeFacilitator, upsertCohort, upsertGroup } from "@/server/actions/admin/structure";

export const metadata = { title: "إدارة الدفعة" };

type Person = { id: string; full_name: string; email: string };

export default async function CohortDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("admin");
  const supabase = await createClient();
  const { data: cohort } = await supabase
    .from("cohorts")
    .select("id, name, start_date, groups(id, name, group_memberships(role, ended_on, users(id, full_name, email)))")
    .eq("id", id)
    .maybeSingle();
  if (!cohort) notFound();
  const groups = [...cohort.groups].sort((a, b) => a.name.localeCompare(b.name, "ar"));
  const active = (g: (typeof groups)[number], role: "member" | "facilitator") =>
    g.group_memberships.filter((m) => m.role === role && !m.ended_on && m.users).map((m) => m.users as Person);
  const emailErrors = { "email:not_found": t("groups.notFound"), "email:conflict": t("groups.alreadyInGroup") };

  return (
    <>
      <h1 className="text-2xl font-semibold">{cohort.name}</h1>
      <Card aria-labelledby="edit-cohort">
        <CardTitle id="edit-cohort" className="mb-3">{t("cohorts.edit")}</CardTitle>
        <ActionForm action={upsertCohort} submitLabel={t("content.save")} successText={t("saved")} fieldErrors={{ "name:conflict": t("cohorts.nameTaken") }}>
          <input type="hidden" name="id" value={cohort.id} />
          <Field name="name" label={t("cohorts.name")} defaultValue={cohort.name} required />
          <Field name="startDate" type="date" label={t("cohorts.startDate")} defaultValue={cohort.start_date} required />
        </ActionForm>
      </Card>

      <h2 className="text-xl font-semibold">{t("groups.title")}</h2>
      {groups.length === 0 && <EmptyState title={t("groups.none")} />}
      {groups.map((g) => {
        const facilitators = active(g, "facilitator");
        const members = active(g, "member");
        const others = groups.filter((o) => o.id !== g.id);
        return (
          <Card key={g.id} aria-labelledby={`group-${g.id}`} className="flex flex-col gap-5">
            <CardTitle id={`group-${g.id}`}>{g.name}</CardTitle>

            <section className="flex flex-col gap-2">
              <h3 className="font-medium">{t("groups.facilitators")}</h3>
              {facilitators.length === 0 && <p className="text-sm text-ink-500">{t("groups.noFacilitator")}</p>}
              <ul className="flex flex-col gap-1">
                {facilitators.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-2">
                    <span>{f.full_name}</span>
                    <form action={removeFacilitator}>
                      <input type="hidden" name="userId" value={f.id} />
                      <input type="hidden" name="groupId" value={g.id} />
                      <Button type="submit" variant="quiet">{t("groups.remove")}</Button>
                    </form>
                  </li>
                ))}
              </ul>
              <ActionForm action={assignFacilitator} submitLabel={t("groups.assign")} resetOnSuccess successText={t("saved")} fieldErrors={emailErrors} className="flex flex-col gap-2">
                <input type="hidden" name="groupId" value={g.id} />
                <Field name="email" type="email" dir="ltr" label={t("groups.assignFacilitator")} required />
              </ActionForm>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="font-medium">{t("groups.members")}</h3>
              {members.length === 0 && <p className="text-sm text-ink-500">{t("groups.noMembers")}</p>}
              <ul className="flex flex-col gap-2">
                {members.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{m.full_name}</span>
                    {others.length > 0 && (
                      <form action={moveMember} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={m.id} />
                        <label className="sr-only" htmlFor={`move-${m.id}`}>{t("groups.moveTo")}</label>
                        <select id={`move-${m.id}`} name="groupId" className="min-h-11 rounded-xl border border-sand-200 bg-white px-2 text-sm">
                          {others.map((o) => (
                            <option key={o.id} value={o.id}>{`${t("groups.moveTo")} ${o.name}`}</option>
                          ))}
                        </select>
                        <Button type="submit" variant="secondary">{t("groups.move")}</Button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
              <ActionForm action={addMember} submitLabel={t("groups.add")} resetOnSuccess successText={t("saved")} fieldErrors={emailErrors} className="flex flex-col gap-2">
                <input type="hidden" name="groupId" value={g.id} />
                <Field name="email" type="email" dir="ltr" label={t("groups.addMember")} hint={t("groups.emailHint")} required />
              </ActionForm>
            </section>
          </Card>
        );
      })}

      <Card aria-labelledby="new-group">
        <CardTitle id="new-group" className="mb-3">{t("groups.new")}</CardTitle>
        <ActionForm action={upsertGroup} submitLabel={t("groups.create")} resetOnSuccess successText={t("saved")} fieldErrors={{ "name:conflict": t("cohorts.nameTaken") }}>
          <input type="hidden" name="cohortId" value={cohort.id} />
          <Field name="name" label={t("groups.name")} required minLength={2} maxLength={80} />
        </ActionForm>
      </Card>
    </>
  );
}
