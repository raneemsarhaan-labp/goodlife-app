import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
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
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-ink-700">{t("intro")}</p>
      <AppearanceForm version={a.version} ritual={a.ritual} reduceTransparency={a.reduceTransparency} />
    </main>
  );
}
