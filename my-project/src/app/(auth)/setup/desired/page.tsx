import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { TextArea } from "@/components/ui/Field";
import { SetupButtons, SetupFrame } from "@/components/features/setup/SetupFrame";
import { setupDesiredState } from "@/server/actions/setup";
import { requireUser } from "@/server/auth";
import { getPlanTexts } from "@/server/queries/setup";

export const generateMetadata = pageTitle("setup");

/** «رحلة البداية» 2/5: «حالي المنشود». */
export default async function SetupDesiredPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  await requireUser();
  const fromToday = (await searchParams).from === "today";
  const [t, texts] = await Promise.all([getTranslations("setup"), getPlanTexts()]);
  return (
    <SetupFrame step={2} title={t("desiredTitle")} intro={t("desiredIntro")} fromToday={fromToday}>
      <form action={setupDesiredState} className="flex flex-col gap-5">
        {fromToday && <input type="hidden" name="from" value="today" />}
        <TextArea name="text" label={t("desiredLabel")} hint={t("desiredHint")} defaultValue={texts.desiredState} maxLength={2000} rows={5} />
        <SetupButtons fromToday={fromToday} />
      </form>
    </SetupFrame>
  );
}
