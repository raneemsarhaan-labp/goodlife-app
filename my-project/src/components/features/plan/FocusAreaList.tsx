import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field, TextArea } from "@/components/ui/Field";
import { deleteFocusArea, reorderFocusAreas, saveFocusArea } from "@/server/actions/plan";
import type { FocusArea } from "@/server/queries/plan";
import { icon } from "@/ui/icons";
import { Icon } from "@/ui/components/Icon";
import { flowIcon } from "@/ui/icons-flow";
import { ReorderList } from "../habits/ReorderList";

/** «مجالات العمل لعامك»: the member's own areas outside the domains, in the plan's card style. */
export async function FocusAreaList({ areas }: { areas: FocusArea[] }) {
  const t = await getTranslations("plan");
  const ta = await getTranslations("admin");
  return (
    <section aria-labelledby="areas" className="pn-card flex flex-col gap-3">
      <h2 id="areas" className="pn-label">
        {t("areasTitle")}
      </h2>
      <p className="pn-note">{t("areasHint")}</p>
      {areas.length === 0 && <p className="pn-empty-row">{t("noAreas")}</p>}
      {areas.length > 0 && (
        <ul className="pn-rows">
          {areas.map((a) => (
            <li key={a.id}>
              <details className="pf-domain">
                <summary className="pf-domain-top">
                  <span className="pn-row-name">{a.title}</span>
                  <Icon src={icon("keyboard_arrow_down")} />
                </summary>
                <div className="flex flex-col gap-2 pt-3">
                  <ActionForm action={saveFocusArea} submitLabel={t("saveArea")} successText={ta("saved")} className="pn-form flex flex-col gap-3">
                    <input type="hidden" name="id" value={a.id} />
                    <Field name="title" label={t("areaTitle")} defaultValue={a.title} required maxLength={80} />
                    <TextArea name="description" label={t("areaDescription")} defaultValue={a.description ?? ""} maxLength={500} />
                  </ActionForm>
                  <form action={deleteFocusArea}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="pn-link border-none bg-transparent">
                      {t("deleteArea")}
                    </button>
                  </form>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
      {areas.length > 1 && (
        <section aria-labelledby="areas-order" className="pn-reorder">
          <h3 id="areas-order" className="pn-group-label">
            <Icon src={flowIcon("reorder")} />
            {t("areasOrderTitle")}
          </h3>
          <ReorderList label={t("areasOrderTitle")} items={areas.map((a) => ({ id: a.id, label: a.title }))} onReorder={reorderFocusAreas} />
        </section>
      )}
      <ActionForm action={saveFocusArea} submitLabel={t("addArea")} resetOnSuccess className="pn-form flex flex-col gap-3 border-t border-dashed border-sand-200 pt-4">
        <Field name="title" label={t("areaTitle")} required maxLength={80} />
        <TextArea name="description" label={t("areaDescription")} maxLength={500} className="min-h-16" />
      </ActionForm>
    </section>
  );
}
