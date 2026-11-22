import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Card, CardTitle } from "@/components/ui/Card";
import { TextArea } from "@/components/ui/Field";
import { saveIdentity } from "@/server/actions/plan";

/** «هويّتي» (spec 005 FR-001): private, a paragraph or two. */
export async function IdentityCard({ value }: { value: string }) {
  const t = await getTranslations("identity");
  return (
    <Card id="identity" aria-labelledby="identity-title" className="flex scroll-mt-6 flex-col gap-3">
      <CardTitle id="identity-title">{t("title")}</CardTitle>
      <ActionForm action={saveIdentity} submitLabel={t("save")} successText={t("saved")}>
        <TextArea name="identity" label={t("title")} hint={t("hint")} placeholder={t("placeholder")} defaultValue={value} maxLength={2000} className="min-h-32" />
      </ActionForm>
    </Card>
  );
}
