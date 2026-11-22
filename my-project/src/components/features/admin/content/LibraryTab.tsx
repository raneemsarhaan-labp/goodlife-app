import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { formatNumber } from "@/lib/format";
import { upsertLibraryHabit } from "@/server/actions/admin/content";
import { getDomains, getLibrary, type LibraryHabit, type LifeDomain } from "@/server/queries/domains";
import { HABIT_ICONS } from "@/ui/icons";

/** «مكتبة العادات» (spec 004 US3, FR-009): suggestions per domain for the add-habit flow. */
export async function LibraryTab() {
  const t = await getTranslations("admin.content");
  const ts = await getTranslations("admin");
  const [domains, library] = await Promise.all([getDomains({ includeInactive: true }), getLibrary({ includeInactive: true })]);

  const row = (domain: LifeDomain, h?: LibraryHabit) => (
    <ActionForm action={upsertLibraryHabit} submitLabel={h ? t("save") : t("addLib")} successText={ts("saved")} resetOnSuccess={!h} className="flex flex-col gap-2">
      {h && <input type="hidden" name="id" value={h.id} />}
      <input type="hidden" name="domainId" value={domain.id} />
      <Field name="name" label={h ? t("libName") : t("newLib")} defaultValue={h?.name ?? ""} maxLength={80} required />
      <Field name="amount" label={t("libAmount")} defaultValue={h?.amount ?? ""} maxLength={60} />
      <Field name="hint" label={t("libHint")} defaultValue={h?.hint ?? ""} maxLength={120} />
      <Select name="icon" label={t("libIcon")} defaultValue={h?.icon ?? ""}>
        <option value="">{t("noIcon")}</option>
        {HABIT_ICONS.map((i) => (
          <option key={i} value={i}>{i.replaceAll("_", " ")}</option>
        ))}
      </Select>
      <Field name="sortOrder" type="number" min={0} max={999} label={t("order")} defaultValue={h?.sort_order ?? library.filter((l) => l.domain_id === domain.id).length + 1} />
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="active" defaultChecked={h?.active ?? true} className="size-5 accent-sage-700" />
        {t("activeLabel")}
      </label>
    </ActionForm>
  );

  return (
    <div className="flex flex-col gap-6">
      <p className="text-ink-700">{t("libraryIntro")}</p>
      {domains.map((d) => {
        const items = library.filter((l) => l.domain_id === d.id);
        return (
          <section key={d.id} aria-labelledby={`lib-${d.key}`} className="flex flex-col gap-3">
            <h2 id={`lib-${d.key}`} className="text-lg font-semibold">
              {d.name} — {formatNumber(items.length)}
            </h2>
            <ul className="flex flex-col gap-3">
              {items.map((h) => (
                <li key={h.id} className="gl-surface rounded-2xl p-4">{row(d, h)}</li>
              ))}
            </ul>
            <details className="gl-surface rounded-2xl border border-dashed border-sand-200 p-4">
              <summary className="min-h-11 cursor-pointer py-2 font-medium">{t("newLib")}</summary>
              {row(d)}
            </details>
          </section>
        );
      })}
    </div>
  );
}
