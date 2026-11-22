"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { setOwnChallenge } from "@/server/actions/today";
import type { TodayChallenge } from "@/server/queries/today";
import { useOutbox } from "./useOutbox";

type Kind = "journey" | "own";

/**
 * The two kinds of daily challenge, always visually distinct (FR-013):
 * «تحدّي الرحلة» (sun, sage) written by the program; «تحدّي ذاتي» (pen, dawn, dashed) by the member.
 */
export function ChallengeCards({ journey, own, localDate }: { journey: TodayChallenge | null; own: TodayChallenge | null; localDate: string }) {
  const t = useTranslations("today");
  const te = useTranslations("errors");
  const tm = useTranslations("makeHabit");
  const router = useRouter();
  const { submit } = useOutbox();
  const [done, setDone] = useState<Record<Kind, boolean>>({ journey: Boolean(journey?.done), own: Boolean(own?.done) });
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

  const doneButton = (kind: Kind) => (
    <Button variant={done[kind] ? "primary" : "secondary"} aria-pressed={done[kind]} onClick={() => void toggle(kind)} className="self-start">
      {done[kind] ? `✓ ${t("challengeDone")}` : t("challengeNotDone")}
    </Button>
  );

  // «اجعلها عادة» (spec 003 FR-020): opens the add-habit form prefilled from this challenge.
  const makeHabit = (kind: Kind) => (
    <Link
      href={`/habits/new?from=${kind}`}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-sage-700 ring-1 ring-sage-600"
    >
      <span aria-hidden="true">↻</span>
      {tm("action")}
    </Link>
  );

  return (
    <div className="flex flex-col gap-3">
      {journey && (
        <section aria-labelledby="journey-challenge" className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-sage-100 bg-sage-50 p-5">
          <h2 id="journey-challenge" className="flex items-center gap-2 text-sm font-semibold text-sage-700">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
            </svg>
            {t("journeyChallenge")}
          </h2>
          <p className="text-lg text-ink-900">{journey.text}</p>
          <div className="flex flex-wrap items-center gap-2">
            {doneButton("journey")}
            {makeHabit("journey")}
          </div>
        </section>
      )}

      <section aria-labelledby="own-challenge" className="flex flex-col gap-3 rounded-[var(--radius-card)] border-2 border-dashed border-dawn-600/40 bg-dawn-50 p-5">
        <h2 id="own-challenge" className="flex items-center gap-2 text-sm font-semibold text-dawn-700">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4" />
          </svg>
          {t("ownChallenge")}
        </h2>
        {editing ? (
          <form action={saveOwn} className="flex flex-col gap-3">
            <label htmlFor="own-challenge-text" className="text-ink-700">
              {t("ownChallengePrompt")}
            </label>
            <input
              id="own-challenge-text"
              name="ownChallenge"
              defaultValue={text}
              maxLength={300}
              placeholder={t("ownChallengePlaceholder")}
              className="min-h-11 rounded-xl gl-surface px-4"
            />
            <Button type="submit" variant="secondary" disabled={saving} className="self-start">
              {t("saveChallenge")}
            </Button>
          </form>
        ) : (
          <>
            <p className="text-lg text-ink-900">{text}</p>
            <div className="flex flex-wrap gap-2">
              {doneButton("own")}
              {makeHabit("own")}
              <Button variant="quiet" onClick={() => setEditing(true)}>
                {t("editChallenge")}
              </Button>
            </div>
          </>
        )}
      </section>
      <Toast message={message} />
    </div>
  );
}
