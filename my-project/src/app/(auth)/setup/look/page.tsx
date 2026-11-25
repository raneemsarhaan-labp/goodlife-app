import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { SetupLookForm } from "@/components/features/appearance/SetupLookForm";
import { SETUP_TOTAL, SetupFrame } from "@/components/features/setup/SetupFrame";
import { requireUser } from "@/server/auth";
import { fromDb } from "@/ui/versions";

export const generateMetadata = pageTitle("setupLook");

/** «كيف تحب أن يبدو تطبيقك؟» — the setup step after joining (spec 002 US1), the last of «رحلة البداية». */
export default async function SetupLookPage() {
  const user = await requireUser();
  const t = await getTranslations("setupLook");
  return (
    <SetupFrame
      step={SETUP_TOTAL}
      title={t("title")}
      intro={t("intro")}
      art={{ src: "/design/challenge-upcoming.webp" }}
      progress={Boolean(user.setupCompletedAt && !user.uiChosenAt)}
      later={false}
      className="au-look"
    >
      <SetupLookForm initial={fromDb(user.uiVersion)} />
    </SetupFrame>
  );
}
