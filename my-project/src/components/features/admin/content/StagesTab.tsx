import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Button } from "@/components/ui/Button";
import { Field, TextArea } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/server";
import { deleteJourneyStage, upsertJourneyStage } from "@/server/actions/admin/resources";

export async function StagesTab() {
  const t = await getTranslations("admin.content");
  const ts = await getTranslations("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("journey_stages").select("id, title, description, from_day, to_day").order("from_day");
  const row = (s?: { id: string; title: string; description: string | null; from_day: number; to_day: number }) => (
    <ActionForm action={upsertJourneyStage} submitLabel={s ? t("save") : t("addStage")} successText={ts("saved")} resetOnSuccess={!s} fieldErrors={{ "fromDay:conflict": t("overlap") }} className="flex flex-col gap-2">
      {s && <input type="hidden" name="id" value={s.id} />}
      <Field name="title" label={s ? t("stageTitle") : t("newStage")} defaultValue={s?.title ?? ""} required maxLength={80} />
      <TextArea name="description" label={t("stageDescription")} defaultValue={s?.description ?? ""} maxLength={1000} className="min-h-16" />
      <div className="grid grid-cols-2 gap-3">
        <Field name="fromDay" type="number" min={1} max={365} label={t("fromDay")} defaultValue={s?.from_day} required />
        <Field name="toDay" type="number" min={1} max={365} label={t("toDay")} defaultValue={s?.to_day} required />
      </div>
    </ActionForm>
  );
  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-700">{t("stagesIntro")}</p>
      <ul className="flex flex-col gap-3">
        {(data ?? []).map((s) => (
          <li key={s.id} className="flex flex-col gap-2 rounded-2xl gl-surface p-4">
            {row(s)}
            <form action={deleteJourneyStage}>
              <input type="hidden" name="id" value={s.id} />
              <Button type="submit" variant="quiet">{t("deleteStage")}</Button>
            </form>
          </li>
        ))}
      </ul>
      <div className="rounded-2xl border border-dashed border-sand-200 gl-surface p-4">{row()}</div>
    </div>
  );
}
