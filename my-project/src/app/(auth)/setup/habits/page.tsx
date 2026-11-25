import { pageTitle } from "@/i18n/metadata";
import { HabitsStep } from "@/components/features/setup/SetupSteps";
import { requireUser } from "@/server/auth";
import { getDomains, getLibrary, getPlanDomains } from "@/server/queries/domains";

export const generateMetadata = pageTitle("setup");

const PER_DOMAIN = 4;

/** «رحلة البداية» 4/5: first habits, suggested from «مكتبة العادات» for the chosen domains. */
export default async function SetupHabitsPage({ searchParams }: { searchParams: Promise<{ from?: string; error?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const [domains, planDomains, library] = await Promise.all([getDomains(), getPlanDomains(), getLibrary()]);
  // The plan's domains; with none chosen, a taste of every domain.
  const shown = planDomains.length ? domains.filter((d) => planDomains.some((p) => p.domainId === d.id)) : domains;
  const perDomain = planDomains.length ? PER_DOMAIN : 2;
  const groups = shown
    .map((domain) => ({ domain, habits: library.filter((h) => h.domain_id === domain.id).slice(0, perDomain) }))
    .filter((g) => g.habits.length > 0);
  return <HabitsStep groups={groups} fromToday={params.from === "today"} error={params.error?.slice(0, 60)} />;
}
