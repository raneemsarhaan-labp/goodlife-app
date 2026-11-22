"use client";

import { IonAccordion, IonAccordionGroup, IonIcon, IonItem, IonLabel, IonList, IonNote } from "@ionic/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Toast } from "@/components/ui/Toast";
import { useOutbox } from "@/components/features/today/useOutbox";
import { formatFraction, formatNumber } from "@/lib/format";
import { weekdayOf, type TimeOfDay } from "@/lib/days";
import { habitIcon, icon } from "@/ui/icons";
import { usePrivateNames } from "@/components/features/habits/HabitName";
import { displayName } from "@/lib/private-habits";
import { GlassCard } from "./GlassCard";

export type WeekDay = { date: string; scheduled: boolean; done: boolean };
export type RowHabit = {
  id: string;
  name: string;
  done: boolean;
  icon?: string | null;
  description?: string | null;
  week_done?: number;
  current_streak?: number;
  /** Spec 004: shape and the current week (Saturday → Friday). */
  amount?: string | null;
  time_of_day?: TimeOfDay;
  week?: WeekDay[];
  week_scheduled?: number;
  is_private?: boolean;
  challenge?: { id: string; title: string; day: number; days: number } | null;
};

const GROUPS: TimeOfDay[] = ["morning", "noon", "evening", "any"];

/**
 * «عاداتي اليومية» (spec 002 FR-021): a horizontal row of circular habit toggles with a done count,
 * expandable to each habit's description, this week's progress and streak. Saving goes through the
 * offline outbox exactly as before (FR-025). Spec 004: grouped by time of day; the detail shows the
 * amount, the week's days, weekly done/scheduled and «سجّل اليوم».
 */
export function HabitRow({
  habits,
  localDate,
  isToday = true,
  onProgress,
}: {
  habits: RowHabit[];
  localDate: string;
  isToday?: boolean;
  onProgress?: (done: number, total: number) => void;
}) {
  const t = useTranslations("today");
  const tt = useTranslations("times");
  const tw = useTranslations("weekdays");
  const tws = useTranslations("weekdaysShort");
  const tg = useTranslations("groupChallenge");
  const privateNames = usePrivateNames();
  const nameOf = (h: RowHabit) => displayName(h.id, h.name, Boolean(h.is_private), privateNames);
  const te = useTranslations("errors");
  const [message, setMessage] = useState<string | null>(null);
  const { submit, pendingIds } = useOutbox({ onDropped: () => setMessage(t("dropped")) });
  const [done, setDone] = useState<Record<string, boolean>>(() => Object.fromEntries(habits.map((h) => [h.id, h.done])));
  const doneCount = habits.filter((h) => done[h.id]).length;

  async function toggle(h: RowHabit) {
    const next = !done[h.id];
    const updated = { ...done, [h.id]: next };
    setDone(updated);
    onProgress?.(habits.filter((x) => updated[x.id]).length, habits.length);
    const outcome = await submit({ kind: "habit", payload: { habitId: h.id, localDate, done: next } });
    if (outcome === "queued") setMessage(t("pending"));
    else if (outcome !== "saved") {
      setDone((d) => ({ ...d, [h.id]: !next }));
      onProgress?.(habits.filter((x) => (x.id === h.id ? !next : updated[x.id])).length, habits.length);
      setMessage(te(outcome.error));
    }
  }

  return (
    <GlassCard title={t("habits")} titleId="habits-title" actions={<span className="text-sm font-medium text-ink-700" aria-live="polite">{t("habitsCount", { progress: formatFraction(doneCount, habits.length) })}</span>}>
      {GROUPS.map((g) => {
        const group = habits.filter((h) => (h.time_of_day ?? "any") === g);
        if (group.length === 0) return null;
        const showHeading = group.length !== habits.length || g !== "any";
        return (
          <section key={g} aria-label={showHeading ? tt(g) : undefined} className="flex flex-col gap-1">
            {showHeading && <h3 className="text-xs font-semibold text-ink-700">{tt(g)}</h3>}
            <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 pt-1">
              {group.map((h) => (
                <li key={h.id} data-habit-id={h.id} className="flex w-[4.5rem] shrink-0 snap-start flex-col items-center gap-1.5 text-center">
                  <button
                    type="button"
                    aria-pressed={Boolean(done[h.id])}
                    aria-label={nameOf(h)}
                    onClick={() => void toggle(h)}
                    className={`relative flex size-14 items-center justify-center rounded-full border-2 transition-colors ${
                      done[h.id] ? "border-gold-500 bg-gold-100" : "border-transparent bg-sage-100"
                    }`}
                  >
                    <IonIcon icon={habitIcon(h.icon)} aria-hidden="true" className="size-7 text-ink-700" />
                    {done[h.id] && (
                      <span aria-hidden="true" className="absolute -bottom-0.5 -start-0.5 flex size-5 items-center justify-center rounded-full bg-gold-700">
                        <IonIcon icon={icon("check")} className="size-3.5 text-white" />
                      </span>
                    )}
                  </button>
                  <span aria-hidden="true" className="text-xs font-semibold leading-tight text-ink-900">{nameOf(h)}</span>
                  {h.challenge && (
                    <span className="rounded-full bg-dawn-50 px-1.5 text-[0.6rem] font-semibold text-ink-900">
                      {tg("flag", { day: formatNumber(h.challenge.day), days: formatNumber(h.challenge.days) })}
                    </span>
                  )}
                  {pendingIds.has(h.id) && <span className="text-[0.65rem] text-dawn-700">{t("pending")}</span>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <IonAccordionGroup>
        <IonAccordion value="details" toggleIcon={icon("keyboard_arrow_down")}>
          <IonItem slot="header" lines="none" className="[--background:transparent] [--padding-start:0]">
            <IonLabel className="text-sm text-ink-700">{t("expandHabits")}</IonLabel>
          </IonItem>
          <IonList slot="content" lines="inset" className="bg-transparent">
            {habits.map((h) => {
              const week = (h.week ?? []).map((d) => (d.date === localDate ? { ...d, done: Boolean(done[h.id]) } : d));
              const weekDone = week.length ? week.filter((d) => d.scheduled && d.done).length : (h.week_done ?? 0);
              return (
                <IonItem key={h.id} className="[--background:transparent]">
                  <IonIcon slot="start" icon={habitIcon(h.icon)} aria-hidden="true" />
                  <IonLabel className="whitespace-normal">
                    <h3 className="font-semibold">{nameOf(h)}</h3>
                    {h.amount && <p>{t("amountLabel", { amount: h.amount })}</p>}
                    {h.description && <p>{h.description}</p>}
                    {week.length > 0 && (
                      <ol aria-label={t("weekTitle")} className="my-2 flex gap-1.5">
                        {week.map((d) => {
                          const wd = weekdayOf(d.date);
                          const state = !d.scheduled ? "off" : d.done ? "done" : d.date < localDate ? "missed" : "upcoming";
                          const stateText = { off: t("dayOff"), done: t("dayDone"), missed: t("dayMissed"), upcoming: t("dayUpcoming") }[state];
                          return (
                            <li
                              key={d.date}
                              aria-label={t("dayLabel", { day: tw(String(wd) as "0"), state: stateText })}
                              aria-current={d.date === localDate ? "date" : undefined}
                              className={`flex size-8 items-center justify-center rounded-full text-[0.6rem] font-semibold ${
                                state === "done"
                                  ? "bg-sage-700 text-white"
                                  : state === "missed"
                                    ? "bg-dawn-50 text-ink-900"
                                    : state === "off"
                                      ? "text-ink-500 opacity-60"
                                      : "bg-sand-100 text-ink-900"
                              } ${d.date === localDate ? "ring-2 ring-dawn-700" : ""}`}
                            >
                              <span aria-hidden="true">{tws(String(wd) as "0").slice(0, 2)}</span>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                    <p>
                      {week.length > 0
                        ? t("weekScheduled", { done: formatNumber(weekDone), total: formatNumber(h.week_scheduled ?? 0) })
                        : t("weekProgress", { done: formatNumber(h.week_done ?? 0) })}
                    </p>
                    {isToday && (
                      <button
                        type="button"
                        onClick={() => void toggle(h)}
                        aria-pressed={Boolean(done[h.id])}
                        className={`mt-2 min-h-11 rounded-full px-4 text-sm font-medium ${done[h.id] ? "text-sage-700 ring-1 ring-sage-600" : "bg-dawn-700 text-white"}`}
                      >
                        {done[h.id] ? t("undoToday") : t("logToday")}
                      </button>
                    )}
                  </IonLabel>
                  <IonNote slot="end" className="flex items-center gap-1 text-ink-700">
                    <IonIcon icon={icon("local_fire_department")} aria-hidden="true" />
                    {t("streak", { count: formatNumber(h.current_streak ?? 0) })}
                  </IonNote>
                </IonItem>
              );
            })}
          </IonList>
        </IonAccordion>
      </IonAccordionGroup>
      <Toast message={message} />
    </GlassCard>
  );
}
