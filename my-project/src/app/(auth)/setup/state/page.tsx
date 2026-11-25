import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { TextArea } from "@/components/ui/Field";
import { SetupButtons, SetupFrame } from "@/components/features/setup/SetupFrame";
import { setupCurrentState } from "@/server/actions/setup";
import { requireUser } from "@/server/auth";
import { getPlanTexts } from "@/server/queries/setup";

export const generateMetadata = pageTitle("setup");

/** «رحلة البداية» 1/5: «واقعي الآن». */
export default async function SetupStatePage({ searchParams }: { searchParams: Promise<{ from?: string; error?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const fromToday = params.from === "today";
  const [t, texts] = await Promise.all([getTranslations("setup"), getPlanTexts()]);
  return (
    <SetupFrame step={1} title={t("stateTitle")} intro={t("stateIntro")} fromToday={fromToday} error={params.error?.slice(0, 60)}>
      <form action={setupCurrentState} className="flex flex-col gap-5">
        {fromToday && <input type="hidden" name="from" value="today" />}
        <TextArea name="text" label={t("stateLabel")} hint={t("stateHint")} defaultValue={texts.currentState} maxLength={5000} rows={5} />
        <SetupButtons fromToday={fromToday} />
      </form>
    </SetupFrame>
  );
}
