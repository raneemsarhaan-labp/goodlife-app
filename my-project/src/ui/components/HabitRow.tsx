"use client";

import { IonAccordion, IonAccordionGroup, IonIcon, IonItem, IonLabel, IonList, IonNote } from "@ionic/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Toast } from "@/components/ui/Toast";
import { useOutbox } from "@/components/features/today/useOutbox";
import { formatFraction, formatNumber } from "@/lib/format";
import { habitIcon, icon } from "@/ui/icons";
import { GlassCard } from "./GlassCard";

export type RowHabit = { id: string; name: string; done: boolean; icon?: string | null; description?: string | null; week_done?: number; current_streak?: number };

/**
 * «عاداتي اليومية» (spec 002 FR-021): a horizontal row of circular habit toggles with a done count,
 * expandable to each habit's description, this week's progress and streak. Saving goes through the
 * offline outbox exactly as before (FR-025).
 */
export function HabitRow({ habits, localDate, onProgress }: { habits: RowHabit[]; localDate: string; onProgress?: (done: number, total: number) => void }) {
  const t = useTranslations("today");
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
      <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 pt-1" aria-labelledby="habits-title">
        {habits.map((h) => (
          <li key={h.id} data-habit-id={h.id} className="flex w-[4.5rem] shrink-0 snap-start flex-col items-center gap-1.5 text-center">
            <button
              type="button"
              aria-pressed={Boolean(done[h.id])}
              aria-label={h.name}
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
            <span aria-hidden="true" className="text-xs font-semibold leading-tight text-ink-900">{h.name}</span>
            {pendingIds.has(h.id) && <span className="text-[0.65rem] text-dawn-700">{t("pending")}</span>}
          </li>
        ))}
      </ul>
      <IonAccordionGroup>
        <IonAccordion value="details" toggleIcon={icon("keyboard_arrow_down")}>
          <IonItem slot="header" lines="none" className="[--background:transparent] [--padding-start:0]">
            <IonLabel className="text-sm text-ink-700">{t("expandHabits")}</IonLabel>
          </IonItem>
          <IonList slot="content" lines="inset" className="bg-transparent">
            {habits.map((h) => (
              <IonItem key={h.id} className="[--background:transparent]">
                <IonIcon slot="start" icon={habitIcon(h.icon)} aria-hidden="true" />
                <IonLabel className="whitespace-normal">
                  <h3 className="font-semibold">{h.name}</h3>
                  {h.description && <p>{h.description}</p>}
                  <p>{t("weekProgress", { done: formatNumber(h.week_done ?? 0) })}</p>
                </IonLabel>
                <IonNote slot="end" className="flex items-center gap-1 text-ink-700">
                  <IonIcon icon={icon("local_fire_department")} aria-hidden="true" />
                  {t("streak", { count: formatNumber(h.current_streak ?? 0) })}
                </IonNote>
              </IonItem>
            ))}
          </IonList>
        </IonAccordion>
      </IonAccordionGroup>
      <Toast message={message} />
    </GlassCard>
  );
}
