"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Toast } from "@/components/ui/Toast";
import { useOutbox } from "@/components/features/today/useOutbox";
import { formatFraction, formatNumber } from "@/lib/format";
import { weekdayOf, type TimeOfDay } from "@/lib/days";
import { icon } from "@/ui/icons";
import { habitIconThin } from "@/ui/icons-thin";
import { usePrivateNames } from "@/components/features/habits/HabitName";
import { displayName } from "@/lib/private-habits";
import { Icon } from "./Icon";

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

/** The designs' habit illustrations, for the habit detail, by icon. */
const ART: Record<string, string> = {
  wb_sunny: "sunrise",
  menu_book: "quran",
  auto_stories: "quran",
  mosque: "quran",
  bedtime: "moon",
  nightlight: "moon",
  family_restroom: "heart",
  volunteer_activism: "heart",
  favorite: "heart",
  fitness_center: "fitness",
  directions_walk: "fitness",
};

/**
 * «عاداتي اليومية» (spec 002 FR-021) as designed: a horizontal row of circular habit toggles with a
 * done count, the day switch and «تفاصيل العادات» with each habit's description, this week's days,
 * weekly progress and streak. Saving goes through the offline outbox exactly as before (FR-025).
 * Spec 004: grouped by time of day; the detail shows the amount, the week and «سجّل اليوم».
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
  const tg = useTranslations("groupChallenge");
  const id = useId();
  const privateNames = usePrivateNames();
  const nameOf = (h: RowHabit) => displayName(h.id, h.name, Boolean(h.is_private), privateNames);
  const te = useTranslations("errors");
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [closedCards, setClosedCards] = useState<Record<string, boolean>>({});
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

  const tone = (h: RowHabit) => `tone-${h.time_of_day ?? "any"}`;

  return (
    <section aria-labelledby={`${id}-title`} className="td-card td-habits">
      <div className="td-card-head">
        <h2 id={`${id}-title`} className="td-card-title">{t("habitsTitle")}</h2>
        <Link href="/stats" aria-label={t("viewStats")} title={t("viewStats")} className="td-round td-hit td-menu">
          <Icon src={icon("more_horiz")} />
        </Link>
      </div>

      <div className="td-habits-row">
        {GROUPS.map((g) => {
          const group = habits.filter((h) => (h.time_of_day ?? "any") === g);
          if (group.length === 0) return null;
          const showHeading = group.length !== habits.length || g !== "any";
          return (
            <section key={g} aria-label={showHeading ? tt(g) : undefined} className="td-hgroup">
              {showHeading && <h3 className="td-hgroup-title">{tt(g)}</h3>}
              <ul>
                {group.map((h) => (
                  <li key={h.id} data-habit-id={h.id} className={`td-avatar ${tone(h)}`}>
                    <button type="button" aria-pressed={Boolean(done[h.id])} aria-label={nameOf(h)} onClick={() => void toggle(h)} className="td-circle">
                      <Icon src={habitIconThin(h.icon)} />
                      {done[h.id] && (
                        <span aria-hidden="true" className="td-circle-check">
                          <Icon src={icon("check")} />
                        </span>
                      )}
                      {h.challenge && (
                        <span aria-hidden="true" className="td-circle-flag">
                          <Icon src={icon("flag")} />
                        </span>
                      )}
                    </button>
                    <span aria-hidden="true" className="td-avatar-label">{nameOf(h)}</span>
                    {h.challenge && <span className="sr-only">{tg("flag", { day: formatNumber(h.challenge.day), days: formatNumber(h.challenge.days) })}</span>}
                    {pendingIds.has(h.id) && <span className="td-avatar-pending">{t("pending")}</span>}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="td-habits-foot">
        <span className="td-frac" aria-live="polite">{t("habitsCount", { progress: formatFraction(doneCount, habits.length) })}</span>
        <div className="td-foot-buttons">
          <nav aria-label={t("habits")} className="td-days-switch">
            {(["today", "yesterday"] as const).map((d) => (
              <Link key={d} href={d === "today" ? "/" : "/?day=yesterday"} aria-current={(d === "today") === isToday ? "page" : undefined} className="td-hit">
                {t(d === "today" ? "todayTab" : "yesterdayTab")}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-details`}
            aria-label={open ? t("collapseHabits") : t("expandHabits")}
            title={open ? t("collapseHabits") : t("expandHabits")}
            onClick={() => setOpen((v) => !v)}
            className="td-round td-hit td-icon-btn"
          >
            <Icon src={icon("keyboard_arrow_down")} />
          </button>
          <Link href="/habits" aria-label={t("manageHabits")} title={t("manageHabits")} className="td-round td-hit td-icon-btn">
            <Icon src={icon("settings")} style={{ width: 17, height: 17 }} />
          </Link>
        </div>
      </div>

      <div id={`${id}-details`} hidden={!open} className="td-details">
        {open &&
          habits.map((h) => {
            const week = (h.week ?? []).map((d) => (d.date === localDate ? { ...d, done: Boolean(done[h.id]) } : d));
            const weekDone = week.length ? week.filter((d) => d.scheduled && d.done).length : (h.week_done ?? 0);
            const weekTotal = week.length ? (h.week_scheduled ?? 0) : 7;
            const art = ART[h.icon ?? ""];
            const cardOpen = !closedCards[h.id];
            const streak = h.current_streak ?? 0;
            const desc = [h.amount ? t("amountLabel", { amount: h.amount }) : null, h.description].filter(Boolean).join(" · ");
            return (
              <article key={h.id} aria-labelledby={`${id}-${h.id}`} className={`td-detail ${tone(h)}`}>
                <div className="td-detail-head">
                  <h3 id={`${id}-${h.id}`} className="td-detail-title">
                    <span className="td-detail-icon" aria-hidden="true">
                      {art ? (
                        // eslint-disable-next-line @next/next/no-img-element -- 40px decorative illustration
                        <img src={`/design/habit-${art}.webp`} alt="" width={40} height={40} loading="lazy" />
                      ) : (
                        <Icon src={habitIconThin(h.icon)} />
                      )}
                    </span>
                    {nameOf(h)}
                  </h3>
                  <button
                    type="button"
                    aria-expanded={cardOpen}
                    aria-label={t("habitDetails", { name: nameOf(h) })}
                    onClick={() => setClosedCards((c) => ({ ...c, [h.id]: cardOpen }))}
                    className="td-round td-hit td-icon-btn"
                  >
                    <Icon src={icon("keyboard_arrow_down")} />
                  </button>
                </div>
                {cardOpen && (
                  <>
                    {desc && <p className="td-detail-desc">{desc}</p>}
                    <div className="td-stats">
                      <div className="td-stat">
                        <div className="td-stat-label">{t("weekLabel")}</div>
                        <div className="td-stat-value">{t("weekValue", { done: formatNumber(weekDone), total: formatNumber(weekTotal) })}</div>
                        <div className="td-bar" aria-hidden="true">
                          <span style={{ width: `${weekTotal ? Math.min(100, (weekDone / weekTotal) * 100) : 0}%` }} />
                        </div>
                      </div>
                      <div className="td-stat">
                        <div className="td-stat-label">{t("streakLabel")}</div>
                        <div className="td-stat-value">
                          <Icon src={icon("local_fire_department")} />
                          {t("streakDays", { count: streak, n: formatNumber(streak) })}
                        </div>
                      </div>
                    </div>
                    {week.length > 0 && (
                      <ol aria-label={t("weekTitle")} className="td-week">
                        {week.map((d) => {
                          const wd = weekdayOf(d.date);
                          const state = !d.scheduled ? "off" : d.done ? "done" : d.date < localDate ? "missed" : "upcoming";
                          const stateText = { off: t("dayOff"), done: t("dayDone"), missed: t("dayMissed"), upcoming: t("dayUpcoming") }[state];
                          return (
                            <li
                              key={d.date}
                              aria-label={t("dayLabel", { day: tw(String(wd) as "0"), state: stateText })}
                              aria-current={d.date === localDate ? "date" : undefined}
                              className={`is-${state}`}
                            >
                              <span className="td-week-dot" aria-hidden="true">
                                {state === "done" && <Icon src={icon("check")} />}
                              </span>
                              <span className="td-week-label" aria-hidden="true">{tw(String(wd) as "0")}</span>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                    {isToday && (
                      <button type="button" onClick={() => void toggle(h)} aria-pressed={Boolean(done[h.id])} className="td-log">
                        <Icon src={icon(done[h.id] ? "close" : "edit")} />
                        {done[h.id] ? t("undoToday") : t("logToday")}
                      </button>
                    )}
                  </>
                )}
              </article>
            );
          })}
      </div>
      <Toast message={message} />
    </section>
  );
}
