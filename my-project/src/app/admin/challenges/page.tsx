import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, TextArea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { formatDate, formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cancelGroupChallenge, saveGroupChallenge } from "@/server/actions/admin/content";
import { requireRole } from "@/server/auth";
import { getDomains } from "@/server/queries/domains";

export const generateMetadata = pageTitle("adminChallenges");

type Row = {
  id: string; title: string; description: string | null; domain_id: string | null; habit_name: string; amount: string | null;
  starts_on: string; duration_days: number; cohort_id: string | null; group_id: string | null; cancelled_at: string | null;
};

/** «التحدّي الجماعيّ» for admins (spec 007 FR-003): no ranking anywhere; counts only. */
export default async function AdminChallengesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireRole("admin");
  const { edit } = await searchParams;
  const t = await getTranslations("admin.challenges");
  const ts = await getTranslations("admin");
  const supabase = await createClient();
  const [domains, { data: rows }, { data: cohorts }, { data: groups }, { data: parts }] = await Promise.all([
    getDomains({ includeInactive: true }),
    supabase.from("group_challenges").select("id, title, description, domain_id, habit_name, amount, starts_on, duration_days, cohort_id, group_id, cancelled_at").order("starts_on", { ascending: false }),
    supabase.from("cohorts").select("id, name").order("start_date", { ascending: false }),
    supabase.from("groups").select("id, name, cohorts(name)").order("name"),
    supabase.from("group_challenge_participants").select("challenge_id").is("withdrawn_at", null),
  ]);
  const count = new Map<string, number>();
  for (const p of parts ?? []) count.set(p.challenge_id, (count.get(p.challenge_id) ?? 0) + 1);
  const editing = (rows as Row[] | null)?.find((r) => r.id === edit);
  const audience = editing ? (editing.cohort_id ? `cohort:${editing.cohort_id}` : `group:${editing.group_id}`) : "";
  return (
    <>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-ink-700">{t("intro")}</p>
      <Card aria-labelledby="ch-form">
        <CardTitle id="ch-form" className="mb-3">{t("new")}</CardTitle>
        <ActionForm key={editing?.id ?? "new"} action={saveGroupChallenge} submitLabel={t("save")} successText={ts("saved")} resetOnSuccess={!editing}>
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <Field name="title" label={t("fTitle")} defaultValue={editing?.title} minLength={2} maxLength={120} required />
          <TextArea name="description" label={t("fDescription")} defaultValue={editing?.description ?? ""} maxLength={1000} />
          <Select name="domainId" label={t("fDomain")} defaultValue={editing?.domain_id ?? ""}>
            <option value="">{t("noDomain")}</option>
            {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Field name="habitName" label={t("fHabit")} defaultValue={editing?.habit_name} maxLength={80} required />
          <Field name="amount" label={t("fAmount")} defaultValue={editing?.amount ?? ""} maxLength={60} />
          <Field name="startsOn" type="date" label={t("fStarts")} defaultValue={editing?.starts_on} required />
          <Field name="durationDays" type="number" min={3} max={90} label={t("fDuration")} defaultValue={editing?.duration_days ?? 7} required />
          <Select name="audience" label={t("fAudience")} defaultValue={audience} required>
            {(cohorts ?? []).map((c) => <option key={c.id} value={`cohort:${c.id}`}>{t("cohort")}: {c.name}</option>)}
            {(groups ?? []).map((g) => <option key={g.id} value={`group:${g.id}`}>{g.cohorts?.name} — {g.name}</option>)}
          </Select>
        </ActionForm>
      </Card>
      {(rows ?? []).length === 0 && <p className="text-ink-700">{t("none")}</p>}
      <ul className="flex flex-col gap-3">
        {((rows ?? []) as Row[]).map((r) => (
          <li key={r.id} className={`flex flex-col gap-1 rounded-2xl border border-sand-200 bg-white p-4 ${r.cancelled_at ? "opacity-60" : ""}`}>
            <p className="font-medium">{r.title}</p>
            <p className="text-sm text-ink-700">{r.habit_name}{r.amount ? ` · ${r.amount}` : ""} · {formatDate(r.starts_on, { withWeekday: false })} · {formatNumber(r.duration_days)}</p>
            <p className="text-sm text-ink-700">{t("participants", { count: formatNumber(count.get(r.id) ?? 0) })}</p>
            {!r.cancelled_at && (
              <div className="flex gap-2">
                <a href={`/admin/challenges?edit=${r.id}`} className="inline-flex min-h-11 items-center text-sage-700 underline underline-offset-4">{ts("activities.edit")}</a>
                <form action={cancelGroupChallenge}>
                  <input type="hidden" name="id" value={r.id} />
                  <Button type="submit" variant="quiet">{t("cancel")}</Button>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
