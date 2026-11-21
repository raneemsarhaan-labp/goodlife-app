import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import type { Peer } from "@/server/queries/community";

export async function GroupHeader({ groupName, cohortName, facilitators }: { groupName: string; cohortName: string; facilitators: Peer[] }) {
  const t = await getTranslations("community");
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-lg font-semibold">{t("group", { group: groupName })}</p>
      <p className="text-ink-700">{t("cohort", { cohort: cohortName })}</p>
      <p className="text-sm text-ink-700">
        {t("facilitators")}: {facilitators.length ? facilitators.map((f) => f.full_name).join("، ") : t("noFacilitator")}
      </p>
    </Card>
  );
}
