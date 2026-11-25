import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { TextArea } from "@/components/ui/Field";
import { saveCurrentState } from "@/server/actions/plan";

/** «واقعي الآن»: a text card in the plan's style (no own design), always open for writing. */
export async function CurrentState({ value }: { value: string }) {
  const t = await getTranslations("plan");
  const ta = await getTranslations("admin");
  return (
    <section aria-labelledby="current-state" className="pn-card">
      <h2 id="current-state" className="pn-label mb-2.5">
        {t("currentStateTitle")}
      </h2>
      <ActionForm action={saveCurrentState} submitLabel={t("saveState")} successText={ta("saved")} className="pn-form pn-hide-label flex flex-col gap-2.5">
        <TextArea
          name="currentState"
          label={t("currentStateTitle")}
          hint={t("currentStateHint")}
          placeholder={t("currentStatePlaceholder")}
          defaultValue={value}
          maxLength={5000}
          className="min-h-40"
        />
      </ActionForm>
    </section>
  );
}
