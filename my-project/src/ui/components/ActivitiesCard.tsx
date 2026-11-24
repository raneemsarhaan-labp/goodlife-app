"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDateTime } from "@/lib/format";
import { icon } from "@/ui/icons";
import type { TodayActivity } from "@/server/queries/today";
import { Icon } from "./Icon";

/** «الأنشطة القادمة» on «يومك» (spec 002 US2), in the designs' card style. */
export function ActivitiesCard({ activities, timeZone }: { activities: TodayActivity[]; timeZone: string }) {
  const t = useTranslations("today");
  return (
    <section aria-labelledby="upcoming" className="td-card">
      <div className="td-card-head" style={{ marginBottom: 8 }}>
        <h2 id="upcoming" className="td-card-title">{t("upcoming")}</h2>
      </div>
      {activities.length === 0 ? (
        <p className="td-empty-note">{t("noUpcoming")}</p>
      ) : (
        <ul className="td-list">
          {activities.map((a) => (
            <li key={a.id}>
              <Link href={`/activities/${a.id}`}>
                <span className="td-round td-list-icon">
                  <Icon src={icon("event")} />
                </span>
                <span className="td-list-text">
                  <span className="td-list-title">{a.title}</span>
                  <span className="td-list-meta">{formatDateTime(a.starts_at, timeZone)}</span>
                  {a.location && <span className="td-list-meta">{a.location}</span>}
                </span>
                <Icon src={icon("chevron_left")} className="td-chevron" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
