import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { AddHabitFlow } from "@/components/features/habits/AddHabitFlow";
import { Sheet } from "@/components/ui/Sheet";
import { habitNameFromChallenge, hasHabitNamed } from "@/lib/make-habit";
import { getDomains, getLibrary, getPlanDomains } from "@/server/queries/domains";
import { getToday } from "@/server/queries/today";

export const generateMetadata = pageTitle("newHabit");

export default async function NewHabitPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; area?: string; from?: string }> }) {
  const [{ returnTo, area, from }, t, domains, planDomains, library] = await Promise.all([
    searchParams,
    getTranslations("addFlow"),
    getDomains(),
    getPlanDomains(),
    getLibrary(),
  ]);
  // `?area=` (from «خطتي») preselects that area's domain when it has one.
  const areaDomain = area ? planDomains.find((p) => p.focusAreaId === area)?.domainId : undefined;
  // «اجعلها عادة» (spec 003 US3): the challenge text is read here, never taken from the URL.
  let prefill: { name: string; duplicate: boolean } | undefined;
  let challengeDomain: string | undefined;
  if (from === "journey" || from === "own") {
    const today = await getToday("today");
    // Spec 005: without a program challenge, the library challenge's linked habit and domain.
    const library = from === "journey" && !today?.journey_challenge ? today?.library_challenge : null;
    const text = library ? (library.habit_name ?? library.title) : (from === "journey" ? today?.journey_challenge : today?.own_challenge)?.text;
    challengeDomain = library?.domain.id;
    if (text) {
      const name = habitNameFromChallenge(text);
      prefill = { name, duplicate: hasHabitNamed((today?.habits ?? []).map((h) => h.name), name) };
    }
  }
  return (
    <Sheet title={t("title")}>
      <AddHabitFlow
        key={prefill?.name ?? "new"}
        domains={domains}
        planDomains={planDomains}
        library={library}
        prefill={prefill}
        initialDomainId={areaDomain ?? challengeDomain}
        returnTo={returnTo === "plan" ? "plan" : undefined}
      />
    </Sheet>
  );
}
