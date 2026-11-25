import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { NavRow } from "@/components/features/screens/ScreenHeader";
import { StatsFrame, type StatsHeader } from "@/components/features/stats/StatsView";
import { formatDate, formatNumber } from "@/lib/format";
import type { GroupChallenge, Together } from "@/server/queries/together";
import { Icon } from "@/ui/components/Icon";
import { icon } from "@/ui/icons";

type Peer = { name: string; me: boolean; habits: { habit: string; done: boolean; together: number }[] };

/**
 * «أثرك ← مجموعتي» (spec 007 US1) as the Glass Edition draws it: the group band, who walks the same
 * habits (you included), what you show, and the group's running challenge. Props only.
 */
export async function TogetherView({ header, data, challenge = null }: { header: StatsHeader; data: Together; challenge?: GroupChallenge | null }) {
  const [t, tc] = await Promise.all([getTranslations("together"), getTranslations("groupChallenge")]);
  const peers = new Map<string, Peer>();
  for (const i of data?.items ?? []) {
    const p = peers.get(i.user_id) ?? { name: i.me ? t("you") : i.name, me: i.me, habits: [] };
    p.habits.push(i);
    peers.set(i.user_id, p);
  }
  const others = [...peers.entries()].filter(([, p]) => !p.me);
  const me = [...peers.entries()].filter(([, p]) => p.me);
  // The design lists you among the others (second row).
  const rows = others.length ? [others[0]!, ...me, ...others.slice(1)] : me;
  const mine = data?.items.filter((x) => x.me) ?? [];
  return (
    <StatsFrame header={header} active="group">
      {!data ? (
        <section className="sc-card">
          <p className="sc-text">{t("noGroup")}</p>
        </section>
      ) : (
        <>
          <Link href="/community" className="sc-hero">
            <Icon src={icon("chevron_right")} className="sc-icon sc-hero-chev" />
            <div className="sc-hero-text">
              <h2 id="group-hero">{data.group.name}</h2>
              <p>
                {t("startedTogether", { date: formatDate(data.group.start_date, { withWeekday: false }) })} ·{" "}
                {t("members", { count: data.group.members, n: formatNumber(data.group.members) })}
              </p>
            </div>
            <span aria-hidden="true" className="sc-hero-icon">
              <Icon src={icon("groups")} className="sc-icon" />
            </span>
          </Link>

          <section aria-labelledby="peers" className="sc-card">
            <div className="sc-card-section-head">
              <h2 id="peers">{t("peersTitle")}</h2>
              <span aria-hidden="true" className="sc-line" />
              <Icon src={icon("groups")} className="sc-icon" />
            </div>
            {!data.sharing ? (
              <p className="sc-text sc-muted">{t("sharingOff")}</p>
            ) : others.length === 0 ? (
              <p className="sc-text sc-muted">{t("peersEmpty")}</p>
            ) : (
              <ul className="sc-peers">
                {rows.map(([id, p], i) => {
                  const together = Math.max(...p.habits.map((h) => h.together));
                  return (
                    <li key={id} className="sc-peer">
                      <span aria-hidden="true" className={`sc-avatar${i % 3 === 2 || i % 5 === 4 ? " is-warm" : ""}`}>
                        {p.me ? "!" : p.name.trim().charAt(0)}
                      </span>
                      <span className="sc-peer-name">{p.name}</span>
                      <ul className="sc-peer-chips">
                        {p.habits.map((h) => (
                          <li key={h.habit} className={`sc-chip-tag${h.done ? " is-done" : ""}`}>
                            {h.done && <span aria-hidden="true">✓ </span>}
                            {h.habit}
                            <span className="sc-sr">: {h.done ? t("doneToday") : t("notYet")}</span>
                          </li>
                        ))}
                      </ul>
                      {together > 1 && (
                        <span className="sc-peer-meta">
                          {t("together", { n: formatNumber(together) })}
                          <Icon src={icon("group")} className="sc-icon" />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="you-show" className="sc-note-card">
            <span aria-hidden="true" className="sc-note-icon">
              <Icon src={icon("eco")} className="sc-icon" />
            </span>
            <div>
              <h2 id="you-show">{t("youShowTitle")}</h2>
              <p>
                {mine.length === 0 ? t("youShowNone") : t("youShowList", { list: mine.map((m) => m.habit).join("، ") })} {t("youShowNote")}
              </p>
            </div>
          </section>

          {challenge && (
            <NavRow
              href="/stats/challenge"
              name={t("challengeNow")}
              sub={[challenge.title, tc("dayOf", { day: formatNumber(challenge.day), days: formatNumber(challenge.duration_days) }), challenge.habit_name].join(" · ")}
              iconName="calendar_month"
              chev="chevron_left"
            />
          )}
        </>
      )}
    </StatsFrame>
  );
}
