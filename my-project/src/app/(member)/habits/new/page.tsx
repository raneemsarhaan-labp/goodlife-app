import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { NewHabitForm } from "@/components/features/today/NewHabitForm";
import { Sheet } from "@/components/ui/Sheet";
import { habitNameFromChallenge, hasHabitNamed } from "@/lib/make-habit";
import { getFocusAreas } from "@/server/queries/plan";
import { getToday } from "@/server/queries/today";

export const generateMetadata = pageTitle("newHabit");

export default async function NewHabitPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; area?: string; from?: string }> }) {
  const [{ returnTo, area, from }, t, areas] = await Promise.all([searchParams, getTranslations("habits"), getFocusAreas()]);
  // «اجعلها عادة» (spec 003 US3): the challenge text is read here, never taken from the URL.
  let prefill: { name: string; duplicate: boolean } | undefined;
  if (from === "journey" || from === "own") {
    const today = await getToday("today");
    const challenge = from === "journey" ? today?.journey_challenge : today?.own_challenge;
    if (challenge?.text) {
      const name = habitNameFromChallenge(challenge.text);
      prefill = { name, duplicate: hasHabitNamed((today?.habits ?? []).map((h) => h.name), name) };
    }
  }
  return (
    <Sheet title={t("newTitle")}>
      <NewHabitForm
        key={prefill?.name ?? "new"}
        areas={areas}
        returnTo={returnTo === "plan" ? "plan" : undefined}
        defaultAreaId={area}
        prefill={prefill}
      />
    </Sheet>
  );
}
