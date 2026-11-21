"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Toast } from "@/components/ui/Toast";
import { formatFraction } from "@/lib/format";
import type { TodayHabit } from "@/server/queries/today";
import { useOutbox } from "./useOutbox";

/** The day's habits with optimistic check-offs that also work offline (FR-011, research §4). */
export function HabitList({ habits, localDate }: { habits: TodayHabit[]; localDate: string }) {
  const t = useTranslations("today");
  const te = useTranslations("errors");
  const [message, setMessage] = useState<string | null>(null);
  const { submit, pendingIds } = useOutbox({ onDropped: () => setMessage(t("dropped")) });
  const [done, setDone] = useState<Record<string, boolean>>(() => Object.fromEntries(habits.map((h) => [h.id, h.done])));

  const doneCount = habits.filter((h) => done[h.id]).length;

  async function toggle(habit: TodayHabit) {
    const next = !done[habit.id];
    setDone((d) => ({ ...d, [habit.id]: next }));
    const outcome = await submit({ kind: "habit", payload: { habitId: habit.id, localDate, done: next } });
    if (outcome === "queued") setMessage(t("pending"));
    else if (outcome !== "saved") {
      setDone((d) => ({ ...d, [habit.id]: !next }));
      setMessage(te(outcome.error));
    }
  }

  return (
    <>
      <p className="text-sm text-ink-700" aria-live="polite">
        {t("habitsProgress", { progress: formatFraction(doneCount, habits.length) })}
      </p>
      <ul className="flex flex-col gap-2">
        {habits.map((habit) => (
          <li key={habit.id} data-habit-id={habit.id}>
            <label
              className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 transition-colors ${
                done[habit.id] ? "border-sage-100 bg-sage-50" : "border-sand-200 bg-white"
              }`}
            >
              <input
                type="checkbox"
                className="size-6 shrink-0 accent-sage-700"
                checked={Boolean(done[habit.id])}
                onChange={() => void toggle(habit)}
              />
              <span className={done[habit.id] ? "text-ink-700" : "text-ink-900"}>{habit.name}</span>
              {pendingIds.has(habit.id) && (
                <span className="ms-auto text-xs text-dawn-700">{t("pending")}</span>
              )}
            </label>
          </li>
        ))}
      </ul>
      <Toast message={message} />
    </>
  );
}
