import { pageTitle } from "@/i18n/metadata";
import { DesiredStep } from "@/components/features/setup/SetupSteps";
import { requireUser } from "@/server/auth";
import { getPlanTexts } from "@/server/queries/setup";

export const generateMetadata = pageTitle("setup");

/** «رحلة البداية» 2/5: «حالي المنشود». */
export default async function SetupDesiredPage({ searchParams }: { searchParams: Promise<{ from?: string; error?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const texts = await getPlanTexts();
  return <DesiredStep text={texts.desiredState} fromToday={params.from === "today"} error={params.error?.slice(0, 60)} />;
}
