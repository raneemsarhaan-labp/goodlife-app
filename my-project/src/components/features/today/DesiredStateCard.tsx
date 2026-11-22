"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";
import { Toast } from "@/components/ui/Toast";
import { REFLECTION_MAX } from "@/lib/validation/reflections";
import { icon } from "@/ui/icons";
import { useOutbox } from "./useOutbox";

const SHORT = 180;

/**
 * «حالي المنشود» on «يومك» (spec 003 US1): the member's own words, a link to edit them in «خطتي»,
 * and a «وقفة تأمل» field saved through the offline outbox (FR-002, FR-003, FR-008).
 */
export function DesiredStateCard({ text, localDate }: { text: string; localDate: string }) {
  const t = useTranslations("desiredState");
  const tr = useTranslations("reflections");
  const te = useTranslations("errors");
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { submit, pendingIds } = useOutbox();
  const value = text.trim();

  if (!value) {
    return (
      <section aria-labelledby={`${id}-title`} className="gl-surface flex flex-col gap-2 rounded-[var(--radius-card)] p-5">
        <h2 id={`${id}-title`} className="text-lg font-semibold">{t("emptyTitle")}</h2>
        <p className="text-ink-700">{t("emptyBody")}</p>
        <Link href="/plan#desired-state" className="inline-flex min-h-11 items-center self-start rounded-full bg-dawn-700 px-5 font-medium text-white">
          {t("emptyAction")}
        </Link>
      </section>
    );
  }

  const long = value.length > SHORT;
  const shown = long && !expanded ? `${value.slice(0, SHORT).replace(/\s+\S*$/, "")}…` : value;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || saving) return;
    setSaving(true);
    const outcome = await submit({ kind: "reflection", payload: { text: body, localDate } });
    setSaving(false);
    if (outcome === "saved" || outcome === "queued") {
      setDraft("");
      setMessage(outcome === "saved" ? tr("saved") : tr("pending"));
      window.setTimeout(() => setMessage(null), 2500);
    } else {
      setMessage(te(outcome.error));
    }
  }

  return (
    <section aria-labelledby={`${id}-title`} className="gl-surface flex flex-col gap-3 rounded-[var(--radius-card)] p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 id={`${id}-title`} className="text-sm font-semibold text-sage-700">{t("title")}</h2>
        <Link href="/plan#desired-state" aria-label={t("edit")} title={t("edit")} className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon("north_east")} alt="" aria-hidden="true" width={20} height={20} className="size-5 opacity-80" />
        </Link>
      </div>
      <p className="whitespace-pre-line text-lg leading-loose text-ink-900">{shown}</p>
      {long && (
        <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="min-h-11 self-start text-sm text-sage-700 underline underline-offset-4">
          {expanded ? t("readLess") : t("readMore")}
        </button>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-2 border-t border-sand-200 pt-3">
        <label htmlFor={`${id}-reflection`} className="text-sm font-medium text-ink-700">{tr("prompt")}</label>
        <textarea
          id={`${id}-reflection`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={REFLECTION_MAX}
          rows={2}
          placeholder={tr("placeholder")}
          className="min-h-20 rounded-xl border border-sand-200 bg-white/80 px-4 py-3 text-base text-ink-900 placeholder:text-ink-500"
        />
        <div className="flex items-center justify-between gap-3">
          <Link href="/plan/reflections" className="text-sm text-sage-700 underline underline-offset-4">{tr("historyLink")}</Link>
          <button type="submit" disabled={!draft.trim() || saving} className="min-h-11 rounded-full bg-dawn-700 px-5 font-medium text-white disabled:opacity-50">
            {tr("save")}
          </button>
        </div>
        {pendingIds.has("reflection") && <p className="text-sm text-dawn-700">{tr("pending")}</p>}
      </form>
      <Toast message={message} />
    </section>
  );
}
