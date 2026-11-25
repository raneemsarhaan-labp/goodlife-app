import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field, TextArea } from "@/components/ui/Field";
import { formatDate, formatNumber } from "@/lib/format";
import { saveDomainArea } from "@/server/actions/plan";
import type { LifeDomain } from "@/server/queries/domains";
import type { FocusArea, PlanHabit } from "@/server/queries/plan";
import { habitIcon, icon } from "@/ui/icons";
import { Icon } from "@/ui/components/Icon";
import { domainClass } from "../habits/domainStyle";
import { HabitName } from "../habits/HabitName";

/** The form that writes a plan domain's texts and review date (shared by «خطتي» and the review). */
export async function DomainForm({ area }: { area: FocusArea }) {
  const t = await getTranslations("domainCard");
  return (
    <ActionForm action={saveDomainArea} submitLabel={t("save")} successText={t("saved")} className="pn-form flex flex-col gap-3">
      <input type="hidden" name="id" value={area.id} />
      <TextArea name="description" label={t("whoLabel")} defaultValue={area.description ?? ""} maxLength={500} />
      <TextArea name="sign" label={t("signLabel")} defaultValue={area.sign ?? ""} maxLength={300} className="min-h-20" />
      <Field name="reviewOn" type="date" label={t("reviewOn")} defaultValue={area.review_on ?? ""} />
    </ActionForm>
  );
}

/**
 * «مجالات عملي هذه السنة» (spec 005 US1) as designed: up to three tinted rows with habit counts; each
 * opens to «من أريد أن أكون», «العلامة», its habits and the review date, then the edit form and a way
 * to add a habit in that domain.
 */
export async function DomainCards({ areas, habits, domains }: { areas: FocusArea[]; habits: PlanHabit[]; domains: LifeDomain[] }) {
  const t = await getTranslations("domainCard");
  const ta = await getTranslations("addFlow");
  const plan = areas.filter((a) => a.domain_id);
  return (
    <section aria-labelledby="plan-domains" className="pn-section">
      <div className="pn-section-head">
        <h2 id="plan-domains">{t("sectionTitle")}</h2>
        <span className="pn-line" aria-hidden="true" />
        <span className="pn-badge" role="img" aria-label={t("count", { n: formatNumber(plan.length) })}>
          {formatNumber(plan.length)}
        </span>
      </div>
      {plan.length === 0 && <p className="pn-empty-row">{t("noDomains")}</p>}
      <ul className="pn-domains">
        {plan.map((a) => {
          const d = domains.find((x) => x.id === a.domain_id);
          const own = habits.filter((h) => h.focus_area_id === a.id);
          const blank = !a.description?.trim() && !a.sign?.trim();
          return (
            <li key={a.id}>
              <details className={`pn-domain ${domainClass(d?.color)}`}>
                <summary className="pn-domain-top">
                  <span className="pn-domain-icon" aria-hidden="true">
                    <Icon src={habitIcon(d?.icon)} />
                  </span>
                  <span className="pn-domain-names">
                    <span className="pn-domain-name">{d?.name ?? a.title}</span>
                    <span className="pn-domain-count">{ta("habitsCount", { count: own.length, n: formatNumber(own.length) })}</span>
                  </span>
                  <span className="pn-domain-chev" aria-hidden="true">
                    <Icon src={icon("keyboard_arrow_down")} />
                  </span>
                </summary>
                <div className="pn-domain-body">
                  {a.description?.trim() && (
                    <>
                      <h3 className="pn-domain-label">{t("whoShort")}</h3>
                      <p className="pn-domain-text">{a.description}</p>
                    </>
                  )}
                  {a.sign?.trim() && (
                    <>
                      <h3 className="pn-domain-label">{t("signShort")}</h3>
                      <p className="pn-domain-text">{a.sign}</p>
                    </>
                  )}
                  {own.length > 0 && (
                    <ul className="pn-domain-habits" aria-label={t("habitsTitle")}>
                      {own.map((h) => (
                        <li key={h.id}>
                          <HabitName id={h.id} name={h.name} isPrivate={h.is_private} />
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="pn-domain-foot">
                    <span>{t("reviewLabel")}</span>
                    <span>{a.review_on ? formatDate(a.review_on, { withWeekday: false }) : "—"}</span>
                  </p>
                  <div className="pn-domain-actions">
                    <details className="pn-more" open={blank}>
                      <summary>{t("edit")}</summary>
                      <DomainForm area={a} />
                    </details>
                    <Link href={`/habits/new?returnTo=plan&area=${a.id}`} className="pn-link">
                      {t("addHabit")}
                    </Link>
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
