import { pageTitle } from "@/i18n/metadata";
import { StateStep } from "@/components/features/setup/SetupSteps";
import { requireUser } from "@/server/auth";
import { getPlanTexts } from "@/server/queries/setup";

export const generateMetadata = pageTitle("setup");

/** «رحلة البداية» 1/5: «واقعي الآن». */
export default async function SetupStatePage({ searchParams }: { searchParams: Promise<{ from?: string; error?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const texts = await getPlanTexts();
  return <StateStep text={texts.currentState} fromToday={params.from === "today"} error={params.error?.slice(0, 60)} />;
}
