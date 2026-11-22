import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { saveLifeDomain } from "@/server/actions/admin/content";
import { getDomains } from "@/server/queries/domains";
import { HABIT_ICONS } from "@/ui/icons";

const COLORS = ["sage", "dawn", "gold", "ink", "violet"] as const;

/** Life domains (spec 004 US3, FR-001): rename, re-icon, recolour, reorder, hide. */
export async function DomainsTab() {
  const t = await getTranslations("admin.content");
  const ts = await getTranslations("admin");
  const domains = await getDomains({ includeInactive: true });
  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-700">{t("domainsIntro")}</p>
      <ul className="flex flex-col gap-3">
        {domains.map((d) => (
          <li key={d.id} className="gl-surface rounded-2xl p-4">
            <ActionForm action={saveLifeDomain} submitLabel={t("save")} successText={ts("saved")} className="flex flex-col gap-2">
              <input type="hidden" name="id" value={d.id} />
              <Field name="name" label={t("domainName")} defaultValue={d.name} minLength={2} maxLength={40} required />
              <Select name="icon" label={t("domainIcon")} defaultValue={d.icon}>
                {HABIT_ICONS.map((i) => (
                  <option key={i} value={i}>{i.replaceAll("_", " ")}</option>
                ))}
              </Select>
              <Select name="color" label={t("domainColor")} defaultValue={d.color}>
                {COLORS.map((c) => (
                  <option key={c} value={c}>{t(`colors.${c}`)}</option>
                ))}
              </Select>
              <Field name="sortOrder" type="number" min={0} max={999} label={t("order")} defaultValue={d.sort_order} />
              <label className="flex min-h-11 items-center gap-3">
                <input type="checkbox" name="active" defaultChecked={d.active} className="size-5 accent-sage-700" />
                {t("activeLabel")}
              </label>
            </ActionForm>
          </li>
        ))}
      </ul>
    </div>
  );
}
