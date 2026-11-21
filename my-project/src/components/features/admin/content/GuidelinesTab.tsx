import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { TextArea } from "@/components/ui/Field";
import { formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { upsertGuideline } from "@/server/actions/admin/resources";

/** The ten «أعراف الرحلة», one form each. */
export async function GuidelinesTab() {
  const t = await getTranslations("admin.content");
  const ts = await getTranslations("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("guidelines").select("number, text");
  const byNumber = new Map((data ?? []).map((g) => [g.number, g.text]));
  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-700">{t("guidelinesIntro")}</p>
      <ol className="flex flex-col gap-3">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <li key={n} className="rounded-2xl border border-sand-200 bg-white p-4">
            <ActionForm action={upsertGuideline} submitLabel={t("save")} successText={ts("saved")} className="flex flex-col gap-2">
              <input type="hidden" name="number" value={n} />
              <TextArea name="text" label={t("guideline", { number: formatNumber(n) })} defaultValue={byNumber.get(n) ?? ""} maxLength={1000} required className="min-h-16" />
            </ActionForm>
          </li>
        ))}
      </ol>
    </div>
  );
}
