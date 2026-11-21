import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field, TextArea } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/server";
import { upsertQuote } from "@/server/actions/admin/content";

type Quote = { id: string; text: string; source: string | null; sort_order: number; active: boolean };

/** Daily quotes for the opening ritual (spec 002 US4, FR-031). */
export async function QuotesTab() {
  const t = await getTranslations("admin.content");
  const ts = await getTranslations("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("quotes").select("id, text, source, sort_order, active").order("sort_order").order("id");
  const row = (q?: Quote) => (
    <ActionForm action={upsertQuote} submitLabel={q ? t("save") : t("addQuote")} successText={ts("saved")} resetOnSuccess={!q} className="flex flex-col gap-2">
      {q && <input type="hidden" name="id" value={q.id} />}
      <TextArea name="text" label={q ? t("quoteText") : t("newQuote")} defaultValue={q?.text ?? ""} minLength={10} maxLength={400} rows={3} required />
      <Field name="source" label={t("quoteSource")} defaultValue={q?.source ?? ""} maxLength={120} />
      <Field name="sortOrder" type="number" min={0} max={9999} label={t("order")} defaultValue={q?.sort_order ?? (data?.length ?? 0) + 1} />
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="active" defaultChecked={q?.active ?? true} className="size-5 accent-sage-700" />
        {t("activeLabel")}
      </label>
    </ActionForm>
  );
  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-700">{t("quotesIntro")}</p>
      <ul className="flex flex-col gap-3">
        {(data ?? []).map((q) => (
          <li key={q.id} className="gl-surface rounded-2xl p-4">
            {row(q)}
          </li>
        ))}
      </ul>
      <div className="gl-surface rounded-2xl border border-dashed border-sand-200 p-4">{row()}</div>
    </div>
  );
}
