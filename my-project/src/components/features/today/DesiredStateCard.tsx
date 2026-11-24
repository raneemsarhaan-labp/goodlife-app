"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";
import { Toast } from "@/components/ui/Toast";
import { REFLECTION_MAX } from "@/lib/limits";
import { icon } from "@/ui/icons";
import { Icon } from "@/ui/components/Icon";
import { useOutbox } from "./useOutbox";

const SHORT = 180;

/** The first sentence leads in bold; the rest follows in the quieter style (as designed). */
export function splitLead(text: string): { lead: string; rest: string } {
  const m = text.match(/^([\s\S]*?[.!؟?…])(\s+[\s\S]*)?$/);
  if (!m || !m[2]?.trim()) return { lead: text, rest: "" };
  return { lead: m[1]!.trim(), rest: m[2].trim() };
}

function Photo() {
  return (
    <span className="td-intent-photo" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative 76px illustration */}
      <img src="/design/desired-state.webp" alt="" width={76} height={76} />
      <Icon src={icon("self_improvement")} />
    </span>
  );
}

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
    // Empty state: the same card and illustration, inviting the member to write it in «خطتي».
    return (
      <section aria-labelledby={`${id}-title`} className="td-card td-intent">
        <div className="td-intent-head">
          <span className="td-label" aria-hidden="true">{t("title")}</span>
        </div>
        <div className="td-intent-row">
          <div className="td-intent-text">
            <h2 id={`${id}-title`} className="td-intent-lead">{t("emptyTitle")}</h2>
            <p className="td-intent-sub">{t("emptyBody")}</p>
          </div>
          <Photo />
        </div>
        <Link href="/plan#desired-state" className="td-pill">
          <span className="td-pill-text">{t("emptyAction")}</span>
          <span className="td-round td-pill-go" aria-hidden="true">
            <Icon src={icon("north_east")} />
          </span>
        </Link>
      </section>
    );
  }

  const long = value.length > SHORT;
  const shown = long && !expanded ? `${value.slice(0, SHORT).replace(/\s+\S*$/, "")}…` : value;
  const { lead, rest } = splitLead(shown);

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
    <section aria-labelledby={`${id}-title`} className="td-card td-intent">
      <div className="td-intent-head">
        <h2 id={`${id}-title`} className="td-label">{t("title")}</h2>
        <Link href="/plan#desired-state" aria-label={t("edit")} title={t("edit")} className="td-round td-hit td-intent-edit">
          <Icon src={icon("edit")} />
        </Link>
      </div>
      <div className="td-intent-row">
        <div className="td-intent-text">
          <p className="td-intent-lead">{lead}</p>
          {rest && <p className="td-intent-sub">{rest}</p>}
          {long && (
            <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="td-intent-more">
              {expanded ? t("readLess") : t("readMore")}
            </button>
          )}
        </div>
        <Photo />
      </div>
      <form onSubmit={onSubmit} className="td-pill">
        <label htmlFor={`${id}-reflection`} className="sr-only">{tr("prompt")}</label>
        <input
          id={`${id}-reflection`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={REFLECTION_MAX}
          placeholder={tr("shortPlaceholder")}
          autoComplete="off"
          enterKeyHint="send"
        />
        <button type="submit" disabled={!draft.trim() || saving} aria-label={tr("save")} title={tr("save")} className="td-round td-hit td-pill-go">
          <Icon src={icon("north_east")} />
        </button>
      </form>
      {pendingIds.has("reflection") && <p className="td-intent-note">{tr("pending")}</p>}
      <Toast message={message} />
    </section>
  );
}
