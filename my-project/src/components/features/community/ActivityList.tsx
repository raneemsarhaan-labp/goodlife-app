import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { RegistrationButton } from "@/components/features/activities/RegistrationButton";
import { SectionHead } from "@/components/features/screens/ScreenHeader";
import { formatDate, formatNumber, formatTime } from "@/lib/format";
import { localDate } from "@/lib/journey";
import { Icon } from "@/ui/components/Icon";
import { icon } from "@/ui/icons";

export type CommunityItem = {
  id: string; title: string; description: string | null; mode: "in_person" | "online"; presenter: string | null; location: string | null;
  next_starts_at: string; session_count: number; registration_open: boolean; registered: boolean; places_left: number | null;
  window_open: boolean; is_new: boolean;
};

/**
 * «أنشطة قادمة» (spec 007 US3): every upcoming activity the member may see (the page loads them
 * with the community_activities RPC), as the design's activity cards: badges, icon, title and description; a tap opens the
 * details (presenter, day, time, place) with inline registration; the footer keeps the date, time and
 * a link to the full page. Registered activities are green, the others terracotta. Props only.
 */
export async function ActivityListView({ items, timeZone }: { items: CommunityItem[]; timeZone: string }) {
  const [t, tr] = await Promise.all([getTranslations("communityList"), getTranslations("activityRegistration")]);
  return (
    <section aria-labelledby="activities-list">
      <SectionHead id="activities-list" title={t("title")} end={<span className="sc-badge">{formatNumber(items.length)}</span>} />
      <p className="sc-note" style={{ margin: "-6px 0 16px" }}>{t("intro")}</p>
      {items.length === 0 && <p className="sc-text sc-muted">{t("empty")}</p>}
      <ul className="sc-events">
        {items.map((a) => {
          const date = formatDate(localDate(timeZone, new Date(a.next_starts_at)));
          const time = formatTime(a.next_starts_at, timeZone);
          const canRegister = a.window_open && a.places_left !== 0;
          return (
            <li key={a.id} className={`sc-event${a.registered ? " is-registered" : ""}`}>
              <details>
                <summary>
                  <span className="sc-event-top">
                    <span className="sc-event-badges">
                      <span className="sc-event-badge">{a.mode === "online" ? tr("online") : tr("inPerson")}</span>
                      {a.registered ? (
                        <span className="sc-event-badge is-fill">{t("registered")}</span>
                      ) : (
                        a.is_new && <span className="sc-event-badge is-fill">{t("new")}</span>
                      )}
                    </span>
                    <span aria-hidden="true" className="sc-event-chev">
                      <Icon src={icon("keyboard_arrow_down")} className="sc-icon" />
                    </span>
                  </span>
                  <span aria-hidden="true" className="sc-event-icon">
                    <Icon src={icon(a.mode === "online" ? "videocam" : "groups")} className="sc-icon" />
                  </span>
                  <h3>{a.title}</h3>
                  {a.description && <span className="sc-event-desc">{a.description}</span>}
                </summary>
                <dl className="sc-event-rows">
                  {a.presenter && (
                    <div className="sc-event-row">
                      <dt>{t("presenterLabel")}</dt>
                      <dd>{a.presenter}</dd>
                    </div>
                  )}
                  <div className="sc-event-row">
                    <dt>{t("dayLabel")}</dt>
                    <dd>{date}</dd>
                  </div>
                  <div className="sc-event-row">
                    <dt>{t("timeLabel")}</dt>
                    <dd>
                      {time}
                      {a.session_count > 1 && ` · ${tr("sessions", { count: a.session_count, n: formatNumber(a.session_count) })}`}
                    </dd>
                  </div>
                  <div className="sc-event-row">
                    <dt>{t("placeLabel")}</dt>
                    <dd>{a.location ?? (a.mode === "online" ? t("online") : "—")}</dd>
                  </div>
                </dl>
                {a.registration_open && (
                  <div className="sc-event-seats">
                    {(a.registered || canRegister) && <RegistrationButton activityId={a.id} registered={a.registered} canRegister={canRegister} />}
                    <p>
                      {a.registered
                        ? t("youRegistered")
                        : a.places_left === null
                          ? tr("unlimited")
                          : tr("placesLeft", { count: a.places_left, n: formatNumber(a.places_left) })}
                    </p>
                  </div>
                )}
              </details>
              <div className="sc-event-foot">
                <Link href={`/activities/${a.id}`} className="sc-event-link">
                  <Icon src={icon("chevron_left")} className="sc-icon" />
                  {a.registered ? t("moreDetails") : t("details")}
                </Link>
                <ul className="sc-event-when">
                  <li>
                    {date}
                    <Icon src={icon("calendar_month")} className="sc-icon" />
                  </li>
                  <li>
                    {time}
                    <Icon src={icon("schedule")} className="sc-icon" />
                  </li>
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
