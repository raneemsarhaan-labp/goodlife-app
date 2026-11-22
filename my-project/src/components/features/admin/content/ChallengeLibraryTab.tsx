import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field, TextArea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { upsertLibraryChallenge } from "@/server/actions/admin/content";
import { getDomains, type LifeDomain } from "@/server/queries/domains";

type Challenge = { id: string; domain_id: string; style: "action" | "reflection"; title: string; prompt: string | null; habit_name: string | null; sort_order: number; active: boolean };

/** «مكتبة التحدّيات» (spec 005 US2, FR-003): challenges per domain for days without a program challenge. */
export async function ChallengeLibraryTab() {
  const t = await getTranslations("admin.content");
  const ts = await getTranslations("admin");
  const supabase = await createClient();
  const [domains, { data }] = await Promise.all([
    getDomains({ includeInactive: true }),
    supabase.from("challenge_library").select("id, domain_id, style, title, prompt, habit_name, sort_order, active").order("sort_order"),
  ]);
  const challenges = (data ?? []) as Challenge[];

  const row = (domain: LifeDomain, c?: Challenge) => (
    <ActionForm action={upsertLibraryChallenge} submitLabel={c ? t("save") : t("addCl")} successText={ts("saved")} resetOnSuccess={!c} className="flex flex-col gap-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <input type="hidden" name="domainId" value={domain.id} />
      <Select name="style" label={t("clStyle")} defaultValue={c?.style ?? "action"}>
        <option value="action">{t("clStyleAction")}</option>
        <option value="reflection">{t("clStyleReflection")}</option>
      </Select>
      <TextArea name="title" label={c ? t("clTitle") : t("newCl")} defaultValue={c?.title ?? ""} minLength={2} maxLength={200} rows={2} required />
      <Field name="prompt" label={t("clPrompt")} defaultValue={c?.prompt ?? ""} maxLength={300} />
      <Field name="habitName" label={t("clHabit")} defaultValue={c?.habit_name ?? ""} maxLength={80} />
      <Field name="sortOrder" type="number" min={0} max={999} label={t("order")} defaultValue={c?.sort_order ?? challenges.filter((x) => x.domain_id === domain.id).length + 1} />
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="active" defaultChecked={c?.active ?? true} className="size-5 accent-sage-700" />
        {t("activeLabel")}
      </label>
    </ActionForm>
  );

  return (
    <div className="flex flex-col gap-6">
      <p className="text-ink-700">{t("clIntro")}</p>
      {domains.map((d) => {
        const items = challenges.filter((c) => c.domain_id === d.id);
        return (
          <section key={d.id} aria-labelledby={`cl-${d.key}`} className="flex flex-col gap-3">
            <h2 id={`cl-${d.key}`} className="text-lg font-semibold">{d.name} — {formatNumber(items.length)}</h2>
            <ul className="flex flex-col gap-3">
              {items.map((c) => (
                <li key={c.id} className="gl-surface rounded-2xl p-4">{row(d, c)}</li>
              ))}
            </ul>
            <details className="gl-surface rounded-2xl border border-dashed border-sand-200 p-4">
              <summary className="min-h-11 cursor-pointer py-2 font-medium">{t("newCl")}</summary>
              {row(d)}
            </details>
          </section>
        );
      })}
    </div>
  );
}
