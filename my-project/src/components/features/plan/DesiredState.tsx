import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { saveDesiredState } from "@/server/actions/plan";
import { PlanTextCard } from "./PlanTextCard";

/** «حالي المنشود» in «خطتي» (spec 003 FR-001), with the way to «تأمّلاتي». */
export async function DesiredState({ value }: { value: string }) {
  const t = await getTranslations("desiredState");
  const tr = await getTranslations("reflections");
  return (
    <PlanTextCard
      variant="intent"
      id="desired-state"
      label={t("planCardTitle")}
      fieldLabel={t("planTitle")}
      hint={t("planHint")}
      placeholder={t("planPlaceholder")}
      emptyText={t("planEmpty")}
      editLabel={t("editHere")}
      saveLabel={t("save")}
      savedText={t("saved")}
      name="desiredState"
      value={value}
      maxLength={2000}
      action={saveDesiredState}
      tools={
        <Link href="/plan/reflections" className="pn-link">
          {tr("historyLink")}
        </Link>
      }
    />
  );
}
