import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { DOMAIN_TINT } from "@/components/features/habits/domainStyle";
import { SetupButtons, SetupFrame } from "@/components/features/setup/SetupFrame";
import { setupDomains } from "@/server/actions/setup";
import { requireUser } from "@/server/auth";
import { getDomains, getPlanDomains } from "@/server/queries/domains";
import { habitIcon } from "@/ui/icons";

export const generateMetadata = pageTitle("setup");

/** «رحلة البداية» 3/5: up to three life domains for the year. */
export default async function SetupDomainsPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  await requireUser();
  const fromToday = (await searchParams).from === "today";
  const [t, domains, planDomains] = await Promise.all([getTranslations("setup"), getDomains(), getPlanDomains()]);
  const chosen = new Set(planDomains.map((d) => d.domainId));
  return (
    <SetupFrame step={3} title={t("domainsTitle")} intro={t("domainsIntro")} fromToday={fromToday}>
      <form action={setupDomains} className="flex flex-col gap-5">
        {fromToday && <input type="hidden" name="from" value="today" />}
        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="sr-only">{t("domainsTitle")}</legend>
          {domains.map((d) => (
            <label
              key={d.id}
              className={`flex min-h-24 cursor-pointer flex-col items-start gap-2 rounded-[var(--radius-card)] p-4 ring-sage-700 has-[:checked]:ring-2 ${DOMAIN_TINT[d.color]}`}
            >
              <span className="flex w-full items-center justify-between">
                <span aria-hidden="true" className="size-7 bg-ink-900" style={{ maskImage: `url("${habitIcon(d.icon)}")`, WebkitMaskImage: `url("${habitIcon(d.icon)}")`, maskSize: "contain", WebkitMaskSize: "contain" }} />
                <input type="checkbox" name="domain" value={d.id} defaultChecked={chosen.has(d.id)} disabled={chosen.has(d.id)} className="size-5 accent-sage-700" />
              </span>
              <span className="font-semibold text-ink-900">{d.name}</span>
            </label>
          ))}
        </fieldset>
        <SetupButtons fromToday={fromToday} />
      </form>
    </SetupFrame>
  );
}
