import { pageTitle } from "@/i18n/metadata";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SubHeader } from "@/components/features/screens/ScreenHeader";
import { Icon } from "@/ui/components/Icon";
import { icon } from "@/ui/icons";
import { requireUser } from "@/server/auth";
import { getMyGroups } from "@/server/queries/community";

export const generateMetadata = pageTitle("groups");

/** «مجموعاتي»: groups led and the group belonged to, labelled by role (FR-042). */
export default async function MyGroupsPage() {
  const user = await requireUser();
  const [t, groups] = await Promise.all([getTranslations("groups"), getMyGroups(user.id)]);
  const sorted = [...groups].sort((a, b) => (a.role === b.role ? a.groupName.localeCompare(b.groupName, "ar") : a.role === "facilitator" ? -1 : 1));
  return (
    <main id="main" className="sc-page is-sub">
      <SubHeader title={t("title")} subtitle={t("intro")} backHref="/more" />
      <div className="sc-content">
        {sorted.length === 0 && <p className="sc-text sc-muted">{t("none")}</p>}
        <ul className="sc-rows">
          {sorted.map((g) => (
            <li key={`${g.groupId}-${g.role}`} className="sc-row">
              <span aria-hidden="true" className="sc-row-icon">
                <Icon src={icon("groups")} className="sc-icon" />
              </span>
              <div className="sc-row-text">
                <p className="sc-row-name">{g.groupName}</p>
                <p className="sc-row-sub">
                  {g.cohortName} · {g.role === "facilitator" ? t("roleFacilitator") : t("roleMember")}
                </p>
              </div>
              <Link href={g.role === "facilitator" ? `/groups/${g.groupId}` : "/community"} className="sc-row-end" aria-label={`${t("open")}: ${g.groupName}`}>
                {g.role === "facilitator" ? t("open") : t("openCommunity")}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
