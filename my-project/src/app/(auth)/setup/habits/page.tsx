import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { SetupButtons, SetupFrame } from "@/components/features/setup/SetupFrame";
import { setupHabits } from "@/server/actions/setup";
import { requireUser } from "@/server/auth";
import { getDomains, getLibrary, getPlanDomains } from "@/server/queries/domains";
import { habitIcon } from "@/ui/icons";

export const generateMetadata = pageTitle("setup");

const PER_DOMAIN = 4;

/** «رحلة البداية» 4/5: first habits, suggested from «مكتبة العادات» for the chosen domains. */
export default async function SetupHabitsPage({ searchParams }: { searchParams: Promise<{ from?: string; error?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const fromToday = params.from === "today";
  const [t, domains, planDomains, library] = await Promise.all([getTranslations("setup"), getDomains(), getPlanDomains(), getLibrary()]);
  // The plan's domains; with none chosen, a taste of every domain.
  const shown = planDomains.length ? domains.filter((d) => planDomains.some((p) => p.domainId === d.id)) : domains;
  const perDomain = planDomains.length ? PER_DOMAIN : 2;
  return (
    <SetupFrame step={4} title={t("habitsTitle")} intro={t("habitsIntro")} fromToday={fromToday} error={params.error?.slice(0, 60)}>
      <form action={setupHabits} className="flex flex-col gap-6">
        {fromToday && <input type="hidden" name="from" value="today" />}
        {shown.map((d) => {
          const habits = library.filter((h) => h.domain_id === d.id).slice(0, perDomain);
          if (habits.length === 0) return null;
          return (
            <fieldset key={d.id} className="flex flex-col gap-2">
              <legend className="mb-1 font-semibold text-ink-900">{d.name}</legend>
              {habits.map((h) => (
                <label key={h.id} className="gl-surface flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 ring-sage-700 has-[:checked]:ring-2">
                  <span aria-hidden="true" className="size-6 shrink-0 bg-sage-700" style={{ maskImage: `url("${habitIcon(h.icon)}")`, WebkitMaskImage: `url("${habitIcon(h.icon)}")`, maskSize: "contain", WebkitMaskSize: "contain" }} />
                  <span className="flex flex-1 flex-col">
                    <span className="font-medium text-ink-900">{h.name}</span>
                    {(h.amount || h.hint) && <span className="text-sm text-ink-700">{[h.amount, h.hint].filter(Boolean).join(" · ")}</span>}
                  </span>
                  <input type="checkbox" name="habit" value={h.id} className="size-5 accent-sage-700" />
                </label>
              ))}
            </fieldset>
          );
        })}
        <p className="text-sm text-ink-700">{t("habitsLater")}</p>
        <SetupButtons fromToday={fromToday} />
      </form>
    </SetupFrame>
  );
}
