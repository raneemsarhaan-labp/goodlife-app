import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Card, CardTitle } from "@/components/ui/Card";
import { TextArea } from "@/components/ui/Field";
import { saveDesiredState } from "@/server/actions/plan";

/** «حالي المنشود» in «خطتي» (spec 003 FR-001), above «واقعي الآن». */
export async function DesiredState({ value }: { value: string }) {
  const t = await getTranslations("desiredState");
  const tr = await getTranslations("reflections");
  return (
    <Card id="desired-state" aria-labelledby="desired-state-title" className="flex scroll-mt-6 flex-col gap-3">
      <CardTitle id="desired-state-title">{t("planTitle")}</CardTitle>
      <ActionForm action={saveDesiredState} submitLabel={t("save")} successText={t("saved")}>
        <TextArea
          name="desiredState"
          label={t("planTitle")}
          hint={t("planHint")}
          placeholder={t("planPlaceholder")}
          defaultValue={value}
          maxLength={2000}
          className="min-h-32"
        />
      </ActionForm>
      <Link href="/plan/reflections" className="self-start text-sage-700 underline underline-offset-4">
        {tr("historyLink")}
      </Link>
    </Card>
  );
}
