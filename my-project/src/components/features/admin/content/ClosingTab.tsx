import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { TextArea } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/server";
import { upsertClosingMessage } from "@/server/actions/admin/content";

export async function ClosingTab() {
  const t = await getTranslations("admin.content");
  const ts = await getTranslations("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("closing_messages").select("id, text, active").order("created_at");
  const row = (m?: { id: string; text: string; active: boolean }) => (
    <ActionForm action={upsertClosingMessage} submitLabel={m ? t("save") : t("addMessage")} successText={ts("saved")} resetOnSuccess={!m} className="flex flex-col gap-2">
      {m && <input type="hidden" name="id" value={m.id} />}
      <TextArea name="text" label={m ? t("messageText") : t("newMessage")} defaultValue={m?.text ?? ""} maxLength={200} required className="min-h-16" />
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="active" defaultChecked={m?.active ?? true} className="size-5 accent-sage-700" />
        {t("activeLabel")}
      </label>
    </ActionForm>
  );
  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-700">{t("closingIntro")}</p>
      <ul className="flex flex-col gap-3">
        {(data ?? []).map((m) => (
          <li key={m.id} className="rounded-2xl border border-sand-200 bg-white p-4">{row(m)}</li>
        ))}
      </ul>
      <div className="rounded-2xl border border-dashed border-sand-200 bg-white p-4">{row()}</div>
    </div>
  );
}
