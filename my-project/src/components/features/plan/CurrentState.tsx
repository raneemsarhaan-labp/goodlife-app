import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Card, CardTitle } from "@/components/ui/Card";
import { TextArea } from "@/components/ui/Field";
import { saveCurrentState } from "@/server/actions/plan";

export async function CurrentState({ value }: { value: string }) {
  const t = await getTranslations("plan");
  const ta = await getTranslations("admin");
  return (
    <Card aria-labelledby="current-state">
      <CardTitle id="current-state" className="mb-3">{t("currentStateTitle")}</CardTitle>
      <ActionForm action={saveCurrentState} submitLabel={t("saveState")} successText={ta("saved")}>
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
    </Card>
  );
}
