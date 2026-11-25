import { getTranslations } from "next-intl/server";
import { SectionHead } from "@/components/features/screens/ScreenHeader";
import { StatsFrame, type StatsHeader } from "@/components/features/stats/StatsView";
import { ChallengeActions } from "@/components/features/together/ChallengeActions";
import { formatDate, formatNumber } from "@/lib/format";
import type { GroupChallenge } from "@/server/queries/together";
import { Icon } from "@/ui/components/Icon";
import { icon } from "@/ui/icons";

/**
 * «أثرك ← التحدّي» (spec 007 US2) as the Glass Edition draws it: the running challenge on the green
 * band, your own progress, and upcoming ones. Own progress and group counts only — the design's
 * «لوحة الترتيب» is left out (no rankings, FR-083).
 */
export async function ChallengeListView({ header, challenges }: { header: StatsHeader; challenges: GroupChallenge[] }) {
  const t = await getTranslations("groupChallenge");
  const running = challenges.filter((c) => c.status === "active");
  const upcoming = challenges.filter((c) => c.status !== "active");
  return (
    <StatsFrame header={header} active="challenge">
      {challenges.length === 0 && (
        <section className="sc-card">
          <p className="sc-text">{t("none")}</p>
        </section>
      )}
      {running.map((c) => (
        <section key={c.id} aria-labelledby={`ch-${c.id}`}>
          <div className="sc-chal">
            <div className="sc-chal-top">
              <span className="sc-chal-day">
                {t("dayOf", { day: formatNumber(c.day), days: formatNumber(c.duration_days) })}
                {c.domain && ` · ${c.domain}`}
              </span>
              <span className="sc-chal-badge">
                <Icon src={icon("trending_up")} className="sc-icon" />
                {t("active")}
              </span>
            </div>
            <h2 id={`ch-${c.id}`}>{c.title}</h2>
            {c.description && <p>{c.description}</p>}
            <span aria-hidden="true" className="sc-chal-bar" style={{ display: "block" }}>
              <i style={{ width: `${Math.round(Math.min(c.day / c.duration_days, 1) * 100)}%` }} />
            </span>
            <div className="sc-chal-bottom">
              <span className="sc-chal-habit">
                {c.habit_name}
                {c.amount && ` · ${c.amount}`}
              </span>
              <span style={{ flexShrink: 0 }}>
                {c.joined ? t("kept", { kept: formatNumber(c.kept), possible: formatNumber(c.possible) }) : t("groupProgress", { done: formatNumber(c.group_done_today), joined: formatNumber(c.group_joined) })}
              </span>
            </div>
          </div>
          <div className="sc-card">
            <h3 className="sc-card-title" style={{ marginTop: 20 }}>{t("yourProgress")}</h3>
            {c.joined && (
              <ul className="sc-chal-stats">
                <li className="sc-chal-stat">
                  <span>
                    <span className="sc-chal-num">{formatNumber(Math.max(c.possible - c.kept, 0))}</span>
                    <span className="sc-chal-label">{t("missed")}</span>
                  </span>
                  <span aria-hidden="true" className="sc-chal-stat-icon" style={{ ["--sc-cs-bg" as string]: "var(--terracotta-100)", ["--sc-cs-fg" as string]: "var(--terracotta-500)" }}>
                    <Icon src={icon("calendar_month")} className="sc-icon" />
                  </span>
                </li>
                <li className="sc-chal-stat">
                  <span>
                    <span className="sc-chal-num">{formatNumber(c.kept)}</span>
                    <span className="sc-chal-label">{t("keptDays")}</span>
                  </span>
                  <span aria-hidden="true" className="sc-chal-stat-icon" style={{ ["--sc-cs-bg" as string]: "var(--green-100)", ["--sc-cs-fg" as string]: "var(--green-700)" }}>
                    <Icon src={icon("check_circle")} className="sc-icon" />
                  </span>
                </li>
              </ul>
            )}
            <hr className="sc-hr" />
            <p className="sc-note">
              {t("groupProgress", { done: formatNumber(c.group_done_today), joined: formatNumber(c.group_joined) })}
              {c.joined && ` ${t("whereHabit")}`}
            </p>
            <ChallengeActions challengeId={c.id} joined={c.joined} />
          </div>
        </section>
      ))}
      {upcoming.map((c) => (
        <section key={c.id} aria-labelledby={`ch-${c.id}`}>
          <SectionHead
            title={t("upcoming")}
            end={
              <span aria-hidden="true" className="sc-section-icon">
                <Icon src={icon("calendar_month")} className="sc-icon" />
              </span>
            }
          />
          <div className="sc-upcoming">
            <div className="sc-upcoming-body">
              <span className="sc-upcoming-badge">
                <Icon src={icon("calendar_month")} className="sc-icon" />
                {t("startsOnShort", { date: formatDate(c.starts_on, { withWeekday: false }) })}
              </span>
              <h3 id={`ch-${c.id}`}>{c.title}</h3>
              <p>
                {t("daysCount", { count: c.duration_days, n: formatNumber(c.duration_days) })} · {c.habit_name}
                {c.amount && ` · ${c.amount}`}
              </p>
              {c.description && <p>{c.description}</p>}
              <ChallengeActions challengeId={c.id} joined={c.joined} />
            </div>
            <span aria-hidden="true" className="sc-upcoming-art">
              {/* eslint-disable-next-line @next/next/no-img-element -- 88px art */}
              <img src="/design/challenge-upcoming.webp" alt="" width={88} height={88} />
            </span>
          </div>
        </section>
      ))}
    </StatsFrame>
  );
}
