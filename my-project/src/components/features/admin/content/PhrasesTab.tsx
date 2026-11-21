import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/server";
import { upsertEncouragementPhrase } from "@/server/actions/admin/content";

export async function PhrasesTab() {
  const t = await getTranslations("admin.content");
  const ts = await getTranslations("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("encouragement_phrases").select("id, text, sort_order, active").order("sort_order");
  const row = (p?: { id: string; text: string; sort_order: number; active: boolean }) => (
    <ActionForm action={upsertEncouragementPhrase} submitLabel={p ? t("save") : t("addPhrase")} successText={ts("saved")} resetOnSuccess={!p} className="flex flex-col gap-2">
      {p && <input type="hidden" name="id" value={p.id} />}
      <Field name="text" label={p ? t("phraseText") : t("newPhrase")} defaultValue={p?.text ?? ""} maxLength={80} required />
      <Field name="sortOrder" type="number" min={0} max={999} label={t("order")} defaultValue={p?.sort_order ?? (data?.length ?? 0) + 1} />
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="active" defaultChecked={p?.active ?? true} className="size-5 accent-sage-700" />
        {t("activeLabel")}
      </label>
    </ActionForm>
  );
  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-700">{t("phrasesIntro")}</p>
      <ul className="flex flex-col gap-3">
        {(data ?? []).map((p) => (
          <li key={p.id} className="rounded-2xl border border-sand-200 bg-white p-4">{row(p)}</li>
        ))}
      </ul>
      <div className="rounded-2xl border border-dashed border-sand-200 bg-white p-4">{row()}</div>
    </div>
  );
}
