import { pageTitle } from "@/i18n/metadata";
import { DomainsStep } from "@/components/features/setup/SetupSteps";
import { requireUser } from "@/server/auth";
import { getDomains, getPlanDomains } from "@/server/queries/domains";

export const generateMetadata = pageTitle("setup");

/** «رحلة البداية» 3/5: up to three life domains for the year. */
export default async function SetupDomainsPage({ searchParams }: { searchParams: Promise<{ from?: string; error?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const [domains, planDomains] = await Promise.all([getDomains(), getPlanDomains()]);
  return (
    <DomainsStep
      domains={domains}
      chosen={new Set(planDomains.map((d) => d.domainId))}
      fromToday={params.from === "today"}
      error={params.error?.slice(0, 60)}
    />
  );
}
