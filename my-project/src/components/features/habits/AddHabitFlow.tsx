"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ALL_DAYS, AMOUNT_MAX, fromMask, type TimeOfDay } from "@/lib/days";
import { formatNumber } from "@/lib/format";
import { addPlanDomain, createHabit, removePlanDomain } from "@/server/actions/habits";
import type { LibraryHabit, LifeDomain, PlanDomain } from "@/server/queries/domains";
import { icon } from "@/ui/icons";
import { habitIconThin } from "@/ui/icons-thin";
import { Icon } from "@/ui/components/Icon";
import { flowIcon } from "@/ui/icons-flow";
import { savePrivateName } from "@/lib/private-habits";
import { DaysPicker } from "./DaysPicker";
import { domainArt, domainClass } from "./domainStyle";
import { FieldLabel } from "./FieldLabel";
import { FlowHeader } from "./FlowHeader";
import { SharingSwitches } from "./SharingSwitches";
import { TimeOfDayPicker } from "./TimeOfDayPicker";

type Step = 1 | 2 | 3;
type Choice = { kind: "library"; item: LibraryHabit } | { kind: "own" };

/**
 * «عادة جديدة» in three steps (spec 004 US1, FR-005), as the Glass Edition draws it: domain (the plan's
 * domains as illustrated cards with −, the others as rows with +), a library suggestion or «عادة من
 * عندي», then amount, time of day, repeat days and privacy. One form, one Server Action on save; the
 * header's round button goes back a step and keeps every choice.
 */
export function AddHabitFlow({
  domains,
  planDomains: initialPlan,
  library,
  prefill,
  initialDomainId,
  returnTo,
}: {
  domains: LifeDomain[];
  planDomains: PlanDomain[];
  library: LibraryHabit[];
  prefill?: { name: string; duplicate: boolean };
  initialDomainId?: string;
  returnTo?: "plan";
}) {
  const t = useTranslations("addFlow");
  const te = useTranslations("errors");
  const tm = useTranslations("makeHabit");
  const [state, dispatch, saving] = useActionState(createHabit, null);
  const [step, setStep] = useState<Step>(prefill ? 2 : 1);
  const [plan, setPlan] = useState(initialPlan);
  const [domainId, setDomainId] = useState<string | undefined>(initialDomainId);
  const [choice, setChoice] = useState<Choice | null>(prefill ? { kind: "own" } : null);
  const [openHint, setOpenHint] = useState<string | null>(null);
  const [ownName, setOwnName] = useState(prefill?.name ?? "");
  const [ownDescription, setOwnDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [time, setTime] = useState<TimeOfDay>("any");
  const [days, setDays] = useState(ALL_DAYS);
  const [privacy, setPrivacy] = useState({ shared: false, isPrivate: false });
  const [clientId, setClientId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [planBusy, startPlan] = useTransition();
  const heading = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step);

  // Move focus to the new step's heading when the step changes (not on first render).
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    heading.current?.focus();
  }, [step]);

  const inPlan = new Set(plan.map((p) => p.domainId));
  const planList = domains.filter((d) => inPlan.has(d.id));
  const otherList = domains.filter((d) => !inPlan.has(d.id));
  const suggestions = library.filter((l) => l.domain_id === domainId);
  const name = choice?.kind === "library" ? choice.item.name : ownName.trim();
  const stepTitles = { 1: [t("step1Title"), t("step1Sub")], 2: [t("step2Title"), t("step2Sub")], 3: [t("step3Title"), t("step3Sub")] } as const;

  function togglePlan(d: LifeDomain) {
    setNotice(null);
    const current = plan.find((p) => p.domainId === d.id);
    if (current) {
      if (current.hasDescription && !window.confirm(t("removeConfirm"))) return;
      startPlan(async () => {
        const r = await removePlanDomain(d.id);
        if (r.ok) setPlan((list) => list.filter((p) => p.domainId !== d.id));
        else setNotice(te(r.error));
      });
    } else {
      if (plan.length >= 3) return setNotice(t("planFull"));
      startPlan(async () => {
        const r = await addPlanDomain(d.id);
        if (r.ok) setPlan((list) => [...list, { domainId: d.id, focusAreaId: r.data.focusAreaId, hasDescription: false, habitCount: 0 }]);
        else setNotice(r.error === "limit_reached" ? t("planFull") : te(r.error));
      });
    }
  }

  function next() {
    setNotice(null);
    if (step === 1 && domainId) setStep(2);
    else if (step === 2) {
      if (!name) return setNotice(t("chooseHabit"));
      if (choice?.kind === "library" && choice.item.amount && !amount) setAmount(choice.item.amount);
      setStep(3);
    }
  }

  const pick = (d: LifeDomain, card: boolean) => (
    <button
      type="button"
      role="radio"
      aria-checked={domainId === d.id}
      onClick={() => {
        setDomainId(d.id);
        setChoice(prefill ? { kind: "own" } : null);
      }}
      className="domain-pick"
    >
      {!card && (
        <span className="dr-icon" aria-hidden="true">
          <Icon src={habitIconThin(d.icon)} />
        </span>
      )}
      <span className={card ? "domain-pick-name" : "dr-name"}>{d.name}</span>
    </button>
  );
  const toggle = (d: LifeDomain, inPlanNow: boolean) => (
    <button
      type="button"
      disabled={planBusy}
      onClick={() => togglePlan(d)}
      aria-label={inPlanNow ? t("removeFromPlan", { name: d.name }) : t("addToPlan", { name: d.name })}
      title={inPlanNow ? t("removeFromPlan", { name: d.name }) : t("addToPlan", { name: d.name })}
      className="domain-toggle td-hit"
    >
      <Icon src={inPlanNow ? flowIcon("remove") : icon("north_east")} />
    </button>
  );

  const back = step > 1;
  const close = back ? (
    <button type="button" onClick={() => setStep((s) => (s - 1) as Step)} className="af-close td-hit" aria-label={t("back")}>
      <Icon src={icon("chevron_left")} />
    </button>
  ) : (
    <Link href={returnTo === "plan" ? "/plan" : "/"} className="af-close td-hit" aria-label={t("close")}>
      <Icon src={icon("chevron_left")} />
    </Link>
  );

  return (
    <form
      action={dispatch}
      onSubmit={() => {
        // «عادة خاصّة»: keep the real name on this device before the placeholder is sent.
        if (privacy.isPrivate && clientId) savePrivateName(clientId, name);
      }}
      className="af-page"
    >
      {/* Every choice travels as a hidden field; only step 3 submits. */}
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="description" value={choice?.kind === "own" ? ownDescription : ""} />
      <input type="hidden" name="domainId" value={domainId ?? ""} />
      <input type="hidden" name="libraryHabitId" value={choice?.kind === "library" ? choice.item.id : ""} />
      <input type="hidden" name="icon" value={choice?.kind === "library" ? (choice.item.icon ?? "") : (domains.find((d) => d.id === domainId)?.icon ?? "")} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

      <FlowHeader tall title={stepTitles[step][0]} sub={stepTitles[step][1]} close={close} segments={3} on={(i) => i < step} headingRef={heading}>
        <p className="sr-only">{t("stepOf", { n: formatNumber(step) })}</p>
        {prefill && <p className="af-chip">{t("fromChallenge")}</p>}
      </FlowHeader>

      <div className="af-body">
        {step === 1 && (
          <>
            <section aria-labelledby="plan-domains">
              <h2 id="plan-domains" className="dg-label">
                <Icon src={icon("eco")} />
                {t("planDomains")}
              </h2>
              {planList.length === 0 ? (
                <p className="af-hint">{t("noPlanDomains")}</p>
              ) : (
                <div role="radiogroup" aria-labelledby="plan-domains" className="domain-grid">
                  {planList.map((d) => {
                    const art = domainArt(d.key);
                    return (
                      <div key={d.id} className={`domain-card ${domainClass(d.color)} ${domainId === d.id ? "is-selected" : ""}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- decorative 96px illustration */}
                        {art && <img src={art} alt="" width={96} height={96} className="dc-art" />}
                        {pick(d, true)}
                        {toggle(d, true)}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            <section aria-labelledby="other-domains">
              <h2 id="other-domains" className="dg-label">
                <Icon src={icon("eco")} />
                {t("otherDomains")}
              </h2>
              <div role="radiogroup" aria-labelledby="other-domains" className="domain-list">
                {otherList.map((d) => (
                  <div key={d.id} className={`domain-row ${domainClass(d.color)} ${domainId === d.id ? "is-selected" : ""}`}>
                    {pick(d, false)}
                    {toggle(d, false)}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="dg-label">
              <Icon src={icon("eco")} />
              {t("suggestions")}
            </h2>
            {suggestions.length === 0 ? (
              <p className="af-hint">{t("noSuggestions")}</p>
            ) : (
              <div role="radiogroup" aria-label={t("suggestions")} className="habit-list">
                {suggestions.map((s) => {
                  const selected = choice?.kind === "library" && choice.item.id === s.id;
                  const sub = [s.hint, s.amount].filter(Boolean).join(" · ");
                  const open = openHint === s.id;
                  return (
                    <div key={s.id} className={`habit-row ${selected ? "is-selected" : ""}`}>
                      <button type="button" role="radio" aria-checked={selected} onClick={() => setChoice({ kind: "library", item: s })} className="habit-pick">
                        <Icon src={habitIconThin(s.icon)} className="hr-icon" />
                        <span className="hr-body">
                          <span className="hr-title">{s.name}</span>
                          {open && sub && (
                            <span id={`hint-${s.id}`} className="hr-sub">
                              {sub}
                            </span>
                          )}
                        </span>
                      </button>
                      {sub && (
                        <button
                          type="button"
                          className="hr-chev td-hit"
                          aria-expanded={open}
                          aria-label={t("details", { name: s.name })}
                          onClick={() => setOpenHint(open ? null : s.id)}
                        >
                          <Icon src={icon("keyboard_arrow_down")} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              aria-expanded={choice?.kind === "own"}
              onClick={() => setChoice(choice?.kind === "own" ? null : { kind: "own" })}
              className="custom-row"
            >
              <Icon src={icon("edit")} className="cr-icon" />
              <span className="cr-title">{t("ownHabit")}</span>
              <span className="cr-plus" aria-hidden="true">
                <Icon src={choice?.kind === "own" ? flowIcon("remove") : icon("add")} />
              </span>
            </button>
            {choice?.kind === "own" && (
              <div className="custom-form">
                <div className="cf-field">
                  <label htmlFor="own-name" className="sr-only">
                    {t("ownName")}
                  </label>
                  <input id="own-name" value={ownName} onChange={(e) => setOwnName(e.target.value)} maxLength={80} placeholder={t("ownNamePlaceholder")} />
                  <Icon src={icon("edit")} />
                </div>
                <div className="cf-field">
                  <label htmlFor="own-description" className="sr-only">
                    {t("ownDescription")}
                  </label>
                  <textarea id="own-description" value={ownDescription} onChange={(e) => setOwnDescription(e.target.value)} maxLength={500} rows={2} placeholder={t("ownDescriptionPlaceholder")} />
                  <Icon src={flowIcon("reorder")} />
                </div>
                {prefill?.duplicate && (
                  <p role="status" className="af-alert mt-2.5">
                    {tm("duplicate")}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <p className="sr-only">{t("chosen", { name })}</p>
            <FieldLabel as="label" htmlFor="amount" text={t("amountLabel")} optional={t("optional")} />
            <div className="af-amount-field">
              <input id="amount" name="amount" value={amount} onChange={(e) => setAmount(e.target.value)} maxLength={AMOUNT_MAX} placeholder={t("amountPlaceholder")} aria-describedby="amount-hint" />
              <span className="af-amount-icon" aria-hidden="true">
                <Icon src={flowIcon("speed")} />
              </span>
            </div>
            <p id="amount-hint" className="af-hint">
              {t("amountHint")}
            </p>
            <TimeOfDayPicker value={time} onChange={setTime} />
            <DaysPicker value={days} onChange={setDays} />
            {fromMask(days).map((d) => (
              <input key={d} type="hidden" name="days" value={d} />
            ))}
            <input type="hidden" name="timeOfDay" value={time} />
            <SharingSwitches
              shared={privacy.shared}
              isPrivate={privacy.isPrivate}
              onChange={(next) => {
                setPrivacy(next);
                if (next.isPrivate && !clientId) setClientId(crypto.randomUUID());
              }}
            />
            {clientId && <input type="hidden" name="clientId" value={clientId} />}
          </>
        )}
      </div>

      <div className="af-footer">
        {(notice || (state && !state.ok)) && (
          <p role="alert" className="af-alert">
            {notice ?? (state && !state.ok ? (state.field === "days" ? t("daysRequired") : te(state.error)) : null)}
          </p>
        )}
        {step < 3 ? (
          <button key="next" type="button" onClick={next} disabled={step === 1 ? !domainId : !name} className="af-next">
            {t("next")}
          </button>
        ) : (
          <button key="save" type="submit" disabled={saving || days === 0} className="af-next">
            <Icon src={icon("eco")} />
            {t("save")}
          </button>
        )}
      </div>
    </form>
  );
}
