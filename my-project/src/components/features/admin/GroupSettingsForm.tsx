import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { saveGroupSettings } from "@/server/actions/admin/structure";

/** «إعدادات المجموعة» (spec 007 US5): open/closed and the tools members see. */
export async function GroupSettingsForm({ groupId, status, features }: { groupId: string; status: "open" | "closed"; features: Record<string, boolean> }) {
  const t = await getTranslations("admin.groupSettings");
  const ts = await getTranslations("admin");
  const on = (k: string) => features?.[k] !== false;
  return (
    <details className="rounded-2xl border border-sand-200 p-3">
      <summary className="min-h-11 cursor-pointer content-center font-medium">
        {t("title")} · {status === "closed" ? t("closed") : t("open")}
      </summary>
      <ActionForm action={saveGroupSettings} submitLabel={t("save")} successText={ts("saved")} className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="groupId" value={groupId} />
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 font-medium">{t("status")}</legend>
          {(["open", "closed"] as const).map((s) => (
            <label key={s} className="flex min-h-11 items-center gap-3">
              <input type="radio" name="status" value={s} defaultChecked={status === s} className="size-5 accent-sage-700" />
              {t(s)}
            </label>
          ))}
          <p className="text-sm text-ink-700">{t("closedHint")}</p>
        </fieldset>
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 font-medium">{t("tools")}</legend>
          {(["sharing", "encouragement", "challenges"] as const).map((k) => (
            <label key={k} className="flex min-h-11 items-center gap-3">
              <input type="checkbox" name={k} defaultChecked={on(k)} className="size-5 accent-sage-700" />
              {t(k)}
            </label>
          ))}
        </fieldset>
      </ActionForm>
    </details>
  );
}
