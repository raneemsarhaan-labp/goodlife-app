"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition, type ReactNode } from "react";
import { Toast } from "@/components/ui/Toast";
import { refreshChallenge, setOwnChallenge } from "@/server/actions/today";
import type { LibraryChallenge, TodayChallenge } from "@/server/queries/today";
import { habitIcon, icon } from "@/ui/icons";
import { Icon } from "@/ui/components/Icon";
import { useOutbox } from "./useOutbox";

type Kind = "journey" | "own";

/**
 * The two kinds of daily challenge, always visually distinct (FR-013), drawn as the designs'
 * «تحدّي اليوم» card: «تحدّي الرحلة» / the library challenge on sage, «تحدّي ذاتي» (pen) on dawn.
 */
export function ChallengeCards({
  journey,
  own,
  library = null,
  localDate,
}: {
  journey: TodayChallenge | null;
  own: TodayChallenge | null;
  /** Spec 005: the day's challenge from the library when the program has none. */
  library?: LibraryChallenge | null;
  localDate: string;
}) {
  const t = useTranslations("today");
  const te = useTranslations("errors");
  const tm = useTranslations("makeHabit");
  const router = useRouter();
  const { submit } = useOutbox();
  const [done, setDone] = useState<Record<Kind, boolean>>({ journey: Boolean(journey?.done ?? library?.done), own: Boolean(own?.done) });
  const [refreshing, startRefresh] = useTransition();
  const [editing, setEditing] = useState(!own);
  const [text, setText] = useState(own?.text ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  async function toggle(kind: Kind) {
    const next = !done[kind];
    setDone((d) => ({ ...d, [kind]: next }));
    const outcome = await submit({ kind: "challenge", payload: { kind, localDate, done: next } });
    if (outcome === "queued") setMessage(t("pending"));
    else if (outcome !== "saved") {
      setDone((d) => ({ ...d, [kind]: !next }));
      setMessage(te(outcome.error));
    }
  }

  function saveOwn(formData: FormData) {
    const value = String(formData.get("ownChallenge") ?? "");
    startSaving(async () => {
      const result = await setOwnChallenge(value);
      if (!result.ok) setMessage(te(result.error));
      else {
        setText(value.trim());
        setEditing(false);
        router.refresh();
      }
    });
  }

  function another() {
    startRefresh(async () => {
      const result = await refreshChallenge();
      if (!result.ok) setMessage(result.error === "limit_reached" ? t("refreshLimit") : te(result.error));
      router.refresh();
    });
  }

  // «أنجزت التحدّي»: a toggle (aria-pressed), saved through the offline outbox.
  const actions = (kind: Kind, extra?: ReactNode) => (
    <div className="td-challenge-actions">
      <button type="button" aria-pressed={done[kind]} onClick={() => void toggle(kind)} className="td-cc-btn td-hit td-cc-done">
        <span className="td-cc-ic">
          <Icon src={icon("check_circle")} />
        </span>
        {t("challengeDoneAction")}
      </button>
      {/* «اجعلها عادة» (spec 003 FR-020): opens the add-habit form prefilled from this challenge. */}
      <Link href={`/habits/new?from=${kind}`} className="td-cc-btn td-hit td-cc-habit">
        <Icon src={icon("repeat")} />
        {tm("action")}
      </Link>
      {extra}
    </div>
  );

  const programTitle = journey ? t("journeyChallenge") : t("todayChallenge");

  return (
    <div className="td-challenges">
      {(journey || library) && (
        <section aria-labelledby="journey-challenge">
          <h2 id="journey-challenge" className="td-section-label">{programTitle}</h2>
          <div className="td-card td-challenge">
            {library && !journey && library.can_refresh && !done.journey && (
              <button
                type="button"
                onClick={another}
                disabled={refreshing}
                aria-label={t("refreshChallenge")}
                title={t("refreshChallenge")}
                className="td-round td-hit td-challenge-refresh"
              >
                <Icon src={icon("autorenew")} />
              </button>
            )}
            {library && !journey ? (
              <>
                <p className="td-challenge-tag">
                  <Icon src={habitIcon(library.domain.icon)} />
                  {library.domain.name} · {library.style === "reflection" ? t("styleReflection") : t("styleAction")}
                </p>
                <h3 className="td-challenge-title">{library.title}</h3>
                {library.prompt ? <p className="td-challenge-body">{library.prompt}</p> : <div className="td-challenge-body" />}
              </>
            ) : (
              <>
                <h3 className="td-challenge-title">{journey!.text}</h3>
                <div className="td-challenge-body" />
              </>
            )}
            {actions("journey")}
          </div>
        </section>
      )}

      <section aria-labelledby="own-challenge">
        <h2 id="own-challenge" className="td-section-label">
          {t("ownChallenge")}
        </h2>
        <div className="td-card td-challenge is-own">
          {editing ? (
            <form action={saveOwn} className="td-challenge-form">
              <label htmlFor="own-challenge-text">{t("ownChallengePrompt")}</label>
              <div className="td-pill">
                <input id="own-challenge-text" name="ownChallenge" defaultValue={text} maxLength={300} placeholder={t("ownChallengePlaceholder")} />
                <button type="submit" disabled={saving} aria-label={t("saveChallenge")} title={t("saveChallenge")} className="td-round td-hit td-pill-go">
                  <Icon src={icon("check")} />
                </button>
              </div>
            </form>
          ) : (
            <>
              <h3 className="td-challenge-title">{text}</h3>
              <div className="td-challenge-body" />
              {actions(
                "own",
                <button type="button" onClick={() => setEditing(true)} className="td-cc-btn td-hit td-cc-quiet">
                  {t("editChallenge")}
                </button>,
              )}
            </>
          )}
        </div>
      </section>
      <Toast message={message} />
    </div>
  );
}
