"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ALL_DAYS, AMOUNT_MAX, fromMask, type TimeOfDay } from "@/lib/days";
import { formatNumber } from "@/lib/format";
import { addPlanDomain, createHabit, removePlanDomain } from "@/server/actions/habits";
import type { LibraryHabit, LifeDomain, PlanDomain } from "@/server/queries/domains";
import { habitIcon } from "@/ui/icons";
import { DaysPicker } from "./DaysPicker";
import { DOMAIN_TINT } from "./domainStyle";
import { TimeOfDayPicker } from "./TimeOfDayPicker";

type Step = 1 | 2 | 3;
type Choice = { kind: "library"; item: LibraryHabit } | { kind: "own" };

/**
 * «عادة جديدة» in three steps (spec 004 US1, FR-005): domain (with + / − for the plan's domains),
 * a library suggestion or «عادة من عندي», then amount, time of day and repeat days. One form, one
 * Server Action on save; Back keeps every choice.
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
  const [ownName, setOwnName] = useState(prefill?.name ?? "");
  const [ownDescription, setOwnDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [time, setTime] = useState<TimeOfDay>("any");
  const [days, setDays] = useState(ALL_DAYS);
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

  const domainButton = (d: LifeDomain, card: boolean) => {
    const selected = domainId === d.id;
    const p = plan.find((x) => x.domainId === d.id);
    return (
      <div key={d.id} className={`relative flex items-stretch rounded-2xl ${DOMAIN_TINT[d.color]} ${selected ? "ring-2 ring-dawn-700" : "ring-1 ring-sand-200"}`}>
        <button
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => {
            setDomainId(d.id);
            setChoice(prefill ? { kind: "own" } : null);
          }}
          className={`flex flex-1 items-center gap-3 p-3 text-start ${card ? "min-h-20" : "min-h-14"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={habitIcon(d.icon)} alt="" aria-hidden="true" width={28} height={28} className="size-7" />
          <span className="flex flex-col">
            <span className="font-semibold text-ink-900">{d.name}</span>
            {card && p && <span className="text-sm text-ink-700">{t("habitsCount", { count: p.habitCount, n: formatNumber(p.habitCount) })}</span>}
          </span>
          {selected && <span className="ms-auto text-sm font-semibold text-dawn-700">✓</span>}
        </button>
        <button
          type="button"
          disabled={planBusy}
          onClick={() => togglePlan(d)}
          aria-label={card ? t("removeFromPlan", { name: d.name }) : t("addToPlan", { name: d.name })}
          title={card ? t("removeFromPlan", { name: d.name }) : t("addToPlan", { name: d.name })}
          className="flex w-12 shrink-0 items-center justify-center rounded-e-2xl text-xl font-semibold text-ink-700 disabled:opacity-50"
        >
          <span aria-hidden="true">{card ? "−" : "+"}</span>
        </button>
      </div>
    );
  };

  return (
    <form action={dispatch} className="flex flex-col gap-5">
      {/* Every choice travels as a hidden field; only step 3 submits. */}
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="description" value={choice?.kind === "own" ? ownDescription : ""} />
      <input type="hidden" name="domainId" value={domainId ?? ""} />
      <input type="hidden" name="libraryHabitId" value={choice?.kind === "library" ? choice.item.id : ""} />
      <input type="hidden" name="icon" value={choice?.kind === "library" ? (choice.item.icon ?? "") : (domains.find((d) => d.id === domainId)?.icon ?? "")} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

      <header className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-sage-700">{t("stepOf", { n: formatNumber(step) })}</p>
        <div className="flex gap-1" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-dawn-700" : "bg-sand-200"}`} />
          ))}
        </div>
        <h2 ref={heading} tabIndex={-1} className="mt-2 text-xl font-semibold outline-none">{stepTitles[step][0]}</h2>
        <p className="text-ink-700">{stepTitles[step][1]}</p>
        {prefill && <p className="mt-1 self-start rounded-full bg-gold-100 px-3 py-1 text-sm font-medium text-ink-900">{t("fromChallenge")}</p>}
      </header>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <section aria-labelledby="plan-domains" className="flex flex-col gap-2">
            <h3 id="plan-domains" className="text-sm font-semibold text-ink-700">{t("planDomains")}</h3>
            {planList.length === 0 ? (
              <p className="text-sm text-ink-700">{t("noPlanDomains")}</p>
            ) : (
              <div role="radiogroup" aria-labelledby="plan-domains" className="grid gap-2">{planList.map((d) => domainButton(d, true))}</div>
            )}
          </section>
          <section aria-labelledby="other-domains" className="flex flex-col gap-2">
            <h3 id="other-domains" className="text-sm font-semibold text-ink-700">{t("otherDomains")}</h3>
            <div role="radiogroup" aria-labelledby="other-domains" className="flex flex-col gap-2">{otherList.map((d) => domainButton(d, false))}</div>
          </section>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-ink-700">{t("suggestions")}</h3>
          {suggestions.length === 0 ? (
            <p className="text-sm text-ink-700">{t("noSuggestions")}</p>
          ) : (
            <div role="radiogroup" aria-label={t("suggestions")} className="flex flex-col gap-2">
              {suggestions.map((s) => {
                const selected = choice?.kind === "library" && choice.item.id === s.id;
                return (
                  <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setChoice({ kind: "library", item: s })}
                      className={`gl-surface flex min-h-14 w-full items-center gap-3 rounded-2xl p-3 text-start ${selected ? "ring-2 ring-dawn-700" : ""}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={habitIcon(s.icon)} alt="" aria-hidden="true" width={24} height={24} className="size-6 shrink-0" />
                      <span className="flex flex-1 flex-col">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink-900">{s.name}</span>
                          {s.amount && <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs text-ink-900">{s.amount}</span>}
                        </span>
                        {s.hint && <span className="text-sm text-ink-700">{s.hint}</span>}
                      </span>
                      {selected && <span className="text-sm font-semibold text-dawn-700">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
          <button
            type="button"
            aria-expanded={choice?.kind === "own"}
            onClick={() => setChoice(choice?.kind === "own" ? null : { kind: "own" })}
            className={`flex min-h-12 items-center gap-2 rounded-2xl border border-dashed border-sand-200 px-4 text-start font-semibold ${choice?.kind === "own" ? "bg-gold-100" : ""}`}
          >
            <span aria-hidden="true">{choice?.kind === "own" ? "−" : "+"}</span>
            {t("ownHabit")}
          </button>
          {choice?.kind === "own" && (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="font-medium">{t("ownName")}</span>
                <input value={ownName} onChange={(e) => setOwnName(e.target.value)} maxLength={80} placeholder={t("ownNamePlaceholder")} className="gl-surface min-h-11 rounded-xl px-4" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-medium">{t("ownDescription")}</span>
                <textarea value={ownDescription} onChange={(e) => setOwnDescription(e.target.value)} maxLength={500} rows={2} className="gl-surface rounded-xl px-4 py-3" />
              </label>
              {prefill?.duplicate && <p role="status" className="text-sm text-dawn-700">{tm("duplicate")}</p>}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <p className="font-semibold">{t("chosen", { name })}</p>
          <label className="flex flex-col gap-1.5">
            <span className="font-medium">{t("amount")}</span>
            <input name="amount" value={amount} onChange={(e) => setAmount(e.target.value)} maxLength={AMOUNT_MAX} placeholder={t("amountPlaceholder")} aria-describedby="amount-hint" className="gl-surface min-h-11 rounded-xl px-4" />
            <span id="amount-hint" className="text-sm text-ink-700">{t("amountHint")}</span>
          </label>
          <TimeOfDayPicker value={time} onChange={setTime} />
          <DaysPicker value={days} onChange={setDays} />
          {fromMask(days).map((d) => (
            <input key={d} type="hidden" name="days" value={d} />
          ))}
          <input type="hidden" name="timeOfDay" value={time} />
        </div>
      )}

      {(notice || (state && !state.ok)) && (
        <p role="alert" className="text-sm text-dawn-700">
          {notice ?? (state && !state.ok ? (state.field === "days" ? t("daysRequired") : te(state.error)) : null)}
        </p>
      )}

      <div className="flex gap-3">
        {step > 1 && (
          <button type="button" onClick={() => setStep((s) => (s - 1) as Step)} className="min-h-12 rounded-full px-6 font-medium text-sage-700 ring-1 ring-sage-600">
            {t("back")}
          </button>
        )}
        {step < 3 ? (
          <button key="next" type="button" onClick={next} disabled={step === 1 ? !domainId : !name} className="min-h-12 flex-1 rounded-full bg-dawn-700 px-6 font-medium text-white disabled:opacity-50">
            {t("next")}
          </button>
        ) : (
          <button key="save" type="submit" disabled={saving || days === 0} className="min-h-12 flex-1 rounded-full bg-dawn-700 px-6 font-medium text-white disabled:opacity-50">
            {t("save")}
          </button>
        )}
      </div>
    </form>
  );
}
