import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, TextArea } from "@/components/ui/Field";
import { deleteFocusArea, reorderFocusAreas, saveFocusArea } from "@/server/actions/plan";
import type { FocusArea } from "@/server/queries/plan";
import { ReorderList } from "../habits/ReorderList";

export async function FocusAreaList({ areas }: { areas: FocusArea[] }) {
  const t = await getTranslations("plan");
  const ta = await getTranslations("admin");
  return (
    <Card aria-labelledby="areas" className="flex flex-col gap-4">
      <CardTitle id="areas">{t("areasTitle")}</CardTitle>
      <p className="text-sm text-ink-700">{t("areasHint")}</p>
      {areas.length === 0 && <p className="text-ink-500">{t("noAreas")}</p>}
      <ul className="flex flex-col gap-3">
        {areas.map((a) => (
          <li key={a.id} className="rounded-2xl border border-sand-200 p-4">
            <details>
              <summary className="min-h-11 cursor-pointer content-center font-medium">{a.title}</summary>
              <div className="mt-3 flex flex-col gap-3">
                <ActionForm action={saveFocusArea} submitLabel={t("saveArea")} successText={ta("saved")}>
                  <input type="hidden" name="id" value={a.id} />
                  <Field name="title" label={t("areaTitle")} defaultValue={a.title} required maxLength={80} />
                  <TextArea name="description" label={t("areaDescription")} defaultValue={a.description ?? ""} maxLength={500} />
                </ActionForm>
                <form action={deleteFocusArea}>
                  <input type="hidden" name="id" value={a.id} />
                  <Button type="submit" variant="quiet">{t("deleteArea")}</Button>
                </form>
              </div>
            </details>
          </li>
        ))}
      </ul>
      {areas.length > 1 && (
        <section aria-labelledby="areas-order" className="flex flex-col gap-2">
          <h3 id="areas-order" className="font-medium">{t("areasOrderTitle")}</h3>
          <ReorderList label={t("areasOrderTitle")} items={areas.map((a) => ({ id: a.id, label: a.title }))} onReorder={reorderFocusAreas} />
        </section>
      )}
      <ActionForm action={saveFocusArea} submitLabel={t("addArea")} resetOnSuccess className="flex flex-col gap-3 border-t border-sand-100 pt-4">
        <Field name="title" label={t("areaTitle")} required maxLength={80} />
        <TextArea name="description" label={t("areaDescription")} maxLength={500} className="min-h-16" />
      </ActionForm>
    </Card>
  );
}
