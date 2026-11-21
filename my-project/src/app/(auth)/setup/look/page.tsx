import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { SetupLookForm } from "@/components/features/appearance/SetupLookForm";
import { requireUser } from "@/server/auth";
import { fromDb } from "@/ui/versions";

export const generateMetadata = pageTitle("setupLook");

/** «كيف تحب أن يبدو تطبيقك؟» — the setup step after joining (spec 002 US1). */
export default async function SetupLookPage() {
  const user = await requireUser();
  const t = await getTranslations("setupLook");
  return (
    <main id="main" className="flex flex-col gap-5">
      <h1 className="text-center text-2xl font-semibold">{t("title")}</h1>
      <p className="text-center leading-loose text-ink-700">{t("intro")}</p>
      <SetupLookForm initial={fromDb(user.uiVersion)} />
    </main>
  );
}
