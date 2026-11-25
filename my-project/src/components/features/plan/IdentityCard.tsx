import { getTranslations } from "next-intl/server";
import { saveIdentity } from "@/server/actions/plan";
import { PlanTextCard } from "./PlanTextCard";

/** «هويّتي» (spec 005 FR-001): private, a paragraph or two. */
export async function IdentityCard({ value }: { value: string }) {
  const t = await getTranslations("identity");
  return (
    <PlanTextCard
      variant="identity"
      id="identity"
      label={t("title")}
      fieldLabel={t("title")}
      hint={t("hint")}
      placeholder={t("placeholder")}
      emptyText={t("empty")}
      editLabel={t("edit")}
      saveLabel={t("save")}
      savedText={t("saved")}
      name="identity"
      value={value}
      maxLength={2000}
      action={saveIdentity}
    />
  );
}
