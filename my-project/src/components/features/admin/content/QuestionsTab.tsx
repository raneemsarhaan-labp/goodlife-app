import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field, TextArea } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/server";
import { upsertReviewQuestion } from "@/server/actions/admin/content";

export async function QuestionsTab() {
  const t = await getTranslations("admin.content");
  const ts = await getTranslations("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("review_questions").select("id, text, sort_order, active").order("sort_order");
  const row = (q?: { id: string; text: string; sort_order: number; active: boolean }) => (
    <ActionForm action={upsertReviewQuestion} submitLabel={q ? t("save") : t("addQuestion")} successText={ts("saved")} resetOnSuccess={!q} className="flex flex-col gap-2">
      {q && <input type="hidden" name="id" value={q.id} />}
      <TextArea name="text" label={q ? t("questionText") : t("newQuestion")} defaultValue={q?.text ?? ""} maxLength={300} required className="min-h-16" />
      <Field name="sortOrder" type="number" min={0} max={999} label={t("order")} defaultValue={q?.sort_order ?? (data?.length ?? 0) + 1} />
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="active" defaultChecked={q?.active ?? true} className="size-5 accent-sage-700" />
        {t("activeLabel")}
      </label>
    </ActionForm>
  );
  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-700">{t("questionsIntro")}</p>
      <ul className="flex flex-col gap-3">
        {(data ?? []).map((q) => (
          <li key={q.id} className="rounded-2xl gl-surface p-4">{row(q)}</li>
        ))}
      </ul>
      <div className="rounded-2xl border border-dashed border-sand-200 gl-surface p-4">{row()}</div>
    </div>
  );
}
