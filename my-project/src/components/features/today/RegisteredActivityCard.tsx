"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { RegisteredActivity } from "@/server/queries/today";
import { dismissActivityCard } from "@/server/actions/activities";
import { icon } from "@/ui/icons";

/** «نشاط سجّلت فيه» on «يومك» (spec 003 FR-015, FR-016, FR-018): closable for the rest of the day. */
export function RegisteredActivityCard({ activity, timeZone }: { activity: RegisteredActivity; timeZone: string }) {
  const t = useTranslations("activityRegistration");
  const [hidden, setHidden] = useState(false);
  const [, start] = useTransition();
  if (hidden) return null;
  const titleId = `registered-${activity.id}`;
  return (
    <section aria-labelledby={titleId} className="gl-surface relative flex items-center gap-3 rounded-[var(--radius-card)] p-4">
      <button
        type="button"
        aria-label={t("close")}
        title={t("close")}
        onClick={() => {
          setHidden(true);
          start(() => void dismissActivityCard(activity.id));
        }}
        className="flex size-11 shrink-0 items-center justify-center rounded-full"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon("close")} alt="" aria-hidden="true" width={20} height={20} className="size-5 opacity-70" />
      </button>
      <Link href={`/activities/${activity.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-xs font-semibold text-sage-700">
            {t("registeredLabel")} · {activity.mode === "online" ? t("online") : t("inPerson")}
          </span>
          <span id={titleId} className="font-semibold text-ink-900">
            {activity.title}
            {activity.session_count > 1 && <span className="font-normal text-ink-700"> — {t("sessions", { count: activity.session_count, n: formatNumber(activity.session_count) })}</span>}
          </span>
          <span className={`text-sm ${activity.cancelled ? "font-semibold text-dawn-700" : "text-ink-700"}`}>
            {activity.cancelled ? t("cancelledToday") : t("nextSession", { when: formatDateTime(activity.next_starts_at, timeZone) })}
          </span>
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon("chevron_left")} alt="" aria-hidden="true" width={20} height={20} className="size-5 shrink-0 opacity-70" />
      </Link>
    </section>
  );
}
