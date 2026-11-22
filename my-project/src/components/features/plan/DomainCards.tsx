import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field, TextArea } from "@/components/ui/Field";
import { formatDate, formatNumber } from "@/lib/format";
import { saveDomainArea } from "@/server/actions/plan";
import type { LifeDomain } from "@/server/queries/domains";
import type { FocusArea, PlanHabit } from "@/server/queries/plan";
import { habitIcon } from "@/ui/icons";
import { DOMAIN_TINT } from "../habits/domainStyle";
import { HabitName } from "../habits/HabitName";

/**
 * «مجالات عملي هذه السنة» (spec 005 US1): up to three domain cards with habit counts; each opens to
 * «من أريد أن أكون», «العلامة», its habits and the review date.
 */
export async function DomainCards({ areas, habits, domains }: { areas: FocusArea[]; habits: PlanHabit[]; domains: LifeDomain[] }) {
  const t = await getTranslations("domainCard");
  const ta = await getTranslations("addFlow");
  const plan = areas.filter((a) => a.domain_id);
  return (
    <section aria-labelledby="plan-domains" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="plan-domains" className="text-lg font-semibold">{t("sectionTitle")}</h2>
        <span className="rounded-full bg-sand-100 px-3 py-1 text-sm font-semibold">{t("count", { n: formatNumber(plan.length) })}</span>
      </div>
      {plan.length === 0 && <p className="text-ink-700">{t("noDomains")}</p>}
      {plan.map((a) => {
        const d = domains.find((x) => x.id === a.domain_id);
        const own = habits.filter((h) => h.focus_area_id === a.id);
        return (
          <details key={a.id} className={`rounded-[var(--radius-card)] ${d ? DOMAIN_TINT[d.color] : "bg-sand-100"} p-4`}>
            <summary className="flex min-h-12 cursor-pointer items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={habitIcon(d?.icon)} alt="" aria-hidden="true" width={28} height={28} className="size-7" />
              <span className="flex flex-1 flex-col">
                <span className="font-semibold text-ink-900">{d?.name ?? a.title}</span>
                <span className="text-sm text-ink-700">
                  {ta("habitsCount", { count: own.length, n: formatNumber(own.length) })}
                  {a.review_on && ` · ${t("reviewOnValue", { date: formatDate(a.review_on, { withWeekday: false }) })}`}
                </span>
              </span>
            </summary>
            <div className="mt-3 flex flex-col gap-4 rounded-2xl bg-white/80 p-4">
              <ActionForm action={saveDomainArea} submitLabel={t("save")} successText={t("saved")}>
                <input type="hidden" name="id" value={a.id} />
                <TextArea name="description" label={t("whoLabel")} defaultValue={a.description ?? ""} maxLength={500} />
                <TextArea name="sign" label={t("signLabel")} defaultValue={a.sign ?? ""} maxLength={300} className="min-h-20" />
                <Field name="reviewOn" type="date" label={t("reviewOn")} defaultValue={a.review_on ?? ""} />
              </ActionForm>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-ink-700">{t("habitsTitle")}</h3>
                {own.length === 0 ? (
                  <p className="text-sm text-ink-700">{t("noHabits")}</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {own.map((h) => (
                      <li key={h.id}>
                        <Link href={`/habits/${h.id}`} className="inline-flex min-h-11 items-center text-ink-900 underline underline-offset-4">
                          <HabitName id={h.id} name={h.name} isPrivate={h.is_private} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <Link href={`/habits/new?returnTo=plan&area=${a.id}`} className="self-start text-sm text-sage-700 underline underline-offset-4">
                  {t("addDomain")}
                </Link>
              </div>
            </div>
          </details>
        );
      })}
    </section>
  );
}
