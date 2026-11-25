import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { InstallRow } from "@/components/features/install/InstallHint";
import { NavRow, ScreenHeader, SectionHead } from "@/components/features/screens/ScreenHeader";
import type { AppRole } from "@/server/auth";
import { Icon } from "@/ui/components/Icon";
import { icon } from "@/ui/icons";

/**
 * «المزيد» (FR-082) as the Glass Edition draws it: the green header band, the profile card (settings
 * opens «حسابي») and rows grouped under «الرحلة», «حسابي» and, for admins, «الإدارة». Props only.
 */
export async function MoreView({
  header,
  user,
  cohortName,
}: {
  header: { name: string; timeZone: string; localDate: string; journeyDay?: number };
  user: { fullName: string; roles: AppRole[]; activeRole: AppRole };
  cohortName: string | null;
}) {
  const [t, ta] = await Promise.all([getTranslations("more"), getTranslations("account")]);
  return (
    <main id="main" className="sc-page">
      <ScreenHeader title={t("title")} dark {...header} />
      <div className="sc-content">
        <section aria-labelledby="profile-name" className="sc-card sc-profile">
          <Link href="/account" className="sc-profile-btn td-hit" aria-label={t("settings")}>
            <Icon src={icon("settings")} className="sc-icon" />
          </Link>
          <div aria-hidden="true" className="sc-profile-avatar">{user.fullName.trim().charAt(0)}</div>
          <h2 id="profile-name">{user.fullName}</h2>
          <p>{cohortName ? `${t("profileLine")} · ${cohortName}` : t("profileLine")}</p>
          <span className="sc-profile-role">{ta(`roles.${user.activeRole}`)}</span>
        </section>

        <SectionHead title={t("journey")} />
        <ul className="sc-rows">
          <li>
            <NavRow href="/resources" name={t("resources")} sub={t("resourcesSub")} iconName="diamond" />
          </li>
          <li>
            <NavRow href="/reviews" name={t("reviews")} sub={t("reviewsSub")} iconName="rate_review" />
          </li>
          <li>
            <NavRow href="/groups" name={t("groups")} sub={t("groupsSub")} iconName="groups" />
          </li>
          <InstallRow />
        </ul>

        <SectionHead title={t("account")} />
        <ul className="sc-rows">
          <li>
            <NavRow href="/account" name={t("account")} sub={t("accountSub")} iconName="account_circle" />
          </li>
          <li>
            <NavRow href="/account/appearance" name={t("appearance")} sub={t("appearanceSub")} iconName="palette" />
          </li>
        </ul>

        {user.roles.includes("admin") && (
          <>
            <SectionHead title={t("adminSection")} />
            <ul className="sc-rows">
              <li>
                <NavRow href="/admin" name={t("admin")} sub={t("adminSub")} iconName="space_dashboard" />
              </li>
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
