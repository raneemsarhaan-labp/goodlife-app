"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { RegisteredActivity } from "@/server/queries/today";
import { dismissActivityCard } from "@/server/actions/activities";
import { icon } from "@/ui/icons";
import { Icon } from "@/ui/components/Icon";

/** «نشاط سجّلت فيه» on «يومك» (spec 003 FR-015, FR-016, FR-018): closable for the rest of the day. */
export function RegisteredActivityCard({ activity, timeZone }: { activity: RegisteredActivity; timeZone: string }) {
  const t = useTranslations("activityRegistration");
  const [hidden, setHidden] = useState(false);
  const [, start] = useTransition();
  if (hidden) return null;
  const titleId = `registered-${activity.id}`;
  return (
    <section aria-labelledby={titleId} className="td-card td-activity">
      <button
        type="button"
        aria-label={t("close")}
        title={t("close")}
        onClick={() => {
          setHidden(true);
          start(() => void dismissActivityCard(activity.id));
        }}
        className="td-round td-hit td-activity-close"
      >
        <Icon src={icon("close")} />
      </button>
      <Link href={`/activities/${activity.id}`}>
        <span className="td-activity-tag">
          {t("registeredLabel")} · {activity.mode === "online" ? t("online") : t("inPerson")}
        </span>
        <span id={titleId} className="td-activity-title">
          {activity.title}
          {activity.session_count > 1 && <> — {t("sessions", { count: activity.session_count, n: formatNumber(activity.session_count) })}</>}
        </span>
        <span className={`td-activity-when ${activity.cancelled ? "is-cancelled" : ""}`}>
          {activity.cancelled ? t("cancelledToday") : t("nextSession", { when: formatDateTime(activity.next_starts_at, timeZone) })}
        </span>
        <Icon src={icon("chevron_left")} className="td-activity-more" />
      </Link>
    </section>
  );
}
