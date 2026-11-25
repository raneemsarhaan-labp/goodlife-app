import { getTranslations } from "next-intl/server";
import { TextArea } from "@/components/ui/Field";
import { domainArt, domainClass } from "@/components/features/habits/domainStyle";
import { setupCurrentState, setupDesiredState, setupDomains, setupHabits } from "@/server/actions/setup";
import type { LibraryHabit, LifeDomain } from "@/server/queries/domains";
import { Icon } from "@/ui/components/Icon";
import { icon } from "@/ui/icons";
import { habitIconThin } from "@/ui/icons-thin";
import { SetupFrame, StepForm } from "./SetupFrame";

/** The four steps of «رحلة البداية» before «شكل التطبيق», as views (pages fetch, previews pass samples). */

type Common = { fromToday?: boolean; error?: string };

/** 1/5 «واقعي الآن». */
export async function StateStep({ text, fromToday = false, error }: Common & { text: string }) {
  const t = await getTranslations("setup");
  return (
    <SetupFrame step={1} title={t("stateTitle")} intro={t("stateIntro")} art={{ src: "/design/identity.webp", plain: true }} fromToday={fromToday} error={error}>
      <StepForm action={setupCurrentState} fromToday={fromToday}>
        <div className="au-card au-form">
          <TextArea name="text" label={t("stateLabel")} hint={t("stateHint")} defaultValue={text} maxLength={5000} rows={6} />
        </div>
      </StepForm>
    </SetupFrame>
  );
}

/** 2/5 «حالي المنشود». */
export async function DesiredStep({ text, fromToday = false, error }: Common & { text: string }) {
  const t = await getTranslations("setup");
  return (
    <SetupFrame step={2} title={t("desiredTitle")} intro={t("desiredIntro")} art={{ src: "/design/desired-state.webp" }} fromToday={fromToday} error={error}>
      <StepForm action={setupDesiredState} fromToday={fromToday}>
        <div className="au-card au-form">
          <TextArea name="text" label={t("desiredLabel")} hint={t("desiredHint")} defaultValue={text} maxLength={2000} rows={6} />
        </div>
      </StepForm>
    </SetupFrame>
  );
}

/** 3/5 up to three life domains for the year: the habit flow's illustrated domain cards. */
export async function DomainsStep({ domains, chosen, fromToday = false, error }: Common & { domains: LifeDomain[]; chosen: Set<string> }) {
  const t = await getTranslations("setup");
  return (
    <SetupFrame step={3} title={t("domainsTitle")} intro={t("domainsIntro")} fromToday={fromToday} error={error}>
      <StepForm action={setupDomains} fromToday={fromToday}>
        <fieldset className="au-domains">
          <legend className="sr-only">{t("domainsTitle")}</legend>
          {domains.map((d) => {
            const art = domainArt(d.key);
            return (
              <label key={d.id} className={`au-domain ${domainClass(d.color)}`}>
                {art ? (
                  // eslint-disable-next-line @next/next/no-img-element -- decorative 92px illustration
                  <img src={art} alt="" width={92} height={92} className="dc-art" />
                ) : (
                  <span className="au-domain-icon" aria-hidden="true">
                    <Icon src={habitIconThin(d.icon)} />
                  </span>
                )}
                <span className="au-domain-name">{d.name}</span>
                <input type="checkbox" name="domain" value={d.id} defaultChecked={chosen.has(d.id)} disabled={chosen.has(d.id)} className="au-check" />
              </label>
            );
          })}
        </fieldset>
      </StepForm>
    </SetupFrame>
  );
}

/** 4/5 first habits, suggested from «مكتبة العادات» for the chosen domains: the flow's suggestion rows. */
export async function HabitsStep({
  groups,
  fromToday = false,
  error,
}: Common & {
  /** Domains with the suggestions to show for each. */
  groups: { domain: LifeDomain; habits: LibraryHabit[] }[];
}) {
  const t = await getTranslations("setup");
  return (
    <SetupFrame step={4} title={t("habitsTitle")} intro={t("habitsIntro")} fromToday={fromToday} error={error}>
      <StepForm action={setupHabits} fromToday={fromToday} footerNote={<p className="au-later-note">{t("habitsLater")}</p>}>
        {groups.map(({ domain: d, habits }) => (
          <fieldset key={d.id} className={`au-habits ${domainClass(d.color)}`}>
            <legend className="dg-label">
              <Icon src={icon("eco")} />
              {d.name}
            </legend>
            {habits.map((h) => (
              <label key={h.id} className="au-habit">
                <span className="au-habit-icon" aria-hidden="true">
                  <Icon src={habitIconThin(h.icon)} />
                </span>
                <span className="au-habit-text">
                  <span className="au-habit-name">{h.name}</span>
                  {(h.amount || h.hint) && <span className="au-habit-sub">{[h.amount, h.hint].filter(Boolean).join(" · ")}</span>}
                </span>
                <input type="checkbox" name="habit" value={h.id} className="au-check" />
              </label>
            ))}
          </fieldset>
        ))}
      </StepForm>
    </SetupFrame>
  );
}
