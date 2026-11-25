import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { SubHeader } from "@/components/features/screens/ScreenHeader";
import { AppearanceForm } from "@/components/features/appearance/AppearanceForm";
import { getAppearance } from "@/server/appearance";
import { requireUser } from "@/server/auth";

export const generateMetadata = pageTitle("appearance");

/** «المظهر» (spec 002 US3). */
export default async function AppearancePage() {
  await requireUser();
  const t = await getTranslations("appearance");
  const a = await getAppearance();
  return (
    <main id="main" className="sc-page is-sub">
      <SubHeader title={t("title")} subtitle={t("intro")} backHref="/account" />
      <div className="sc-content sc-forms">
        <AppearanceForm version={a.version} ritual={a.ritual} reduceTransparency={a.reduceTransparency} />
      </div>
    </main>
  );
}
