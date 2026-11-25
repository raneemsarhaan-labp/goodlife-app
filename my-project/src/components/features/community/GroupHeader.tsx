import { getTranslations } from "next-intl/server";
import type { Peer } from "@/server/queries/community";

export async function GroupHeader({ groupName, cohortName, facilitators }: { groupName: string; cohortName: string; facilitators: Peer[] }) {
  const t = await getTranslations("community");
  return (
    <section className="sc-card">
      <p className="sc-text" style={{ fontWeight: 700, fontSize: 16 }}>{t("group", { group: groupName })}</p>
      <p className="sc-text">{t("cohort", { cohort: cohortName })}</p>
      <p className="sc-text sc-muted">
        {t("facilitators")}: {facilitators.length ? facilitators.map((f) => f.full_name).join("، ") : t("noFacilitator")}
      </p>
    </section>
  );
}
