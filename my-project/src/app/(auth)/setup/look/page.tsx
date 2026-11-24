import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { SetupLookForm } from "@/components/features/appearance/SetupLookForm";
import { SETUP_TOTAL } from "@/components/features/setup/SetupFrame";
import { formatNumber } from "@/lib/format";
import { requireUser } from "@/server/auth";
import { fromDb } from "@/ui/versions";

export const generateMetadata = pageTitle("setupLook");

/** «كيف تحب أن يبدو تطبيقك؟» — the setup step after joining (spec 002 US1). */
export default async function SetupLookPage() {
  const user = await requireUser();
  const [t, ts] = await Promise.all([getTranslations("setupLook"), getTranslations("setup")]);
  return (
    <main id="main" className="flex flex-col gap-5">
      {user.setupCompletedAt && !user.uiChosenAt && (
        <>
          <p className="text-sm text-ink-700">{ts("progress", { step: formatNumber(SETUP_TOTAL), total: formatNumber(SETUP_TOTAL) })}</p>
          <ol aria-hidden="true" className="flex gap-1.5">
            {Array.from({ length: SETUP_TOTAL }, (_, i) => (
              <li key={i} className="h-1.5 flex-1 rounded-full bg-sage-700" />
            ))}
          </ol>
        </>
      )}
      <h1 className="text-center text-2xl font-semibold">{t("title")}</h1>
      <p className="text-center leading-loose text-ink-700">{t("intro")}</p>
      <SetupLookForm initial={fromDb(user.uiVersion)} />
    </main>
  );
}
