import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { RateBar } from "@/components/features/stats/RateBar";
import { StatsTabs } from "@/components/features/stats/StatsTabs";
import { ChallengeActions } from "@/components/features/together/ChallengeActions";
import { Card } from "@/components/ui/Card";
import { formatDate, formatNumber } from "@/lib/format";
import { requireUser } from "@/server/auth";
import { getMyChallenges } from "@/server/queries/together";

export const generateMetadata = pageTitle("statsChallenge");

/** «التحدّي» (spec 007 US2): own progress and group counts — never a ranking (FR-083). */
export default async function ChallengePage() {
  await requireUser();
  const [t, tt, challenges] = await Promise.all([getTranslations("groupChallenge"), getTranslations("together"), getMyChallenges()]);
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <h1 className="text-2xl font-semibold">{tt("tabs.challenge")}</h1>
      <StatsTabs active="challenge" />
      {challenges.length === 0 && <Card><p>{t("none")}</p></Card>}
      {challenges.map((c) => (
        <section key={c.id} aria-labelledby={`ch-${c.id}`} className="gl-surface flex flex-col gap-3 rounded-[var(--radius-card)] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold text-ink-900 ${c.status === "active" ? "bg-sage-100" : "bg-gold-100"}`}>
              {c.status === "active" ? t("active") : t("upcoming")}
            </span>
            {c.domain && <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-900">{c.domain}</span>}
          </div>
          <h2 id={`ch-${c.id}`} className="text-xl font-semibold text-ink-900">{c.title}</h2>
          {c.description && <p className="text-ink-700">{c.description}</p>}
          <p className="text-ink-900">
            {t("habit", { name: c.habit_name })}
            {c.amount && ` · ${t("amount", { amount: c.amount })}`}
          </p>
          {c.status === "active" ? (
            <>
              <p className="font-semibold text-ink-900">{t("dayOf", { day: formatNumber(c.day), days: formatNumber(c.duration_days) })}</p>
              <RateBar rate={c.day / c.duration_days} />
            </>
          ) : (
            <p className="text-ink-900">{t("startsOn", { date: formatDate(c.starts_on, { withWeekday: false }), days: formatNumber(c.duration_days) })}</p>
          )}
          {c.joined && c.status === "active" && (
            <div className="flex flex-col gap-1 rounded-2xl bg-sage-50 p-3">
              <h3 className="text-sm font-semibold text-ink-700">{t("yourProgress")}</h3>
              <p className="text-ink-900">{t("kept", { kept: formatNumber(c.kept), possible: formatNumber(c.possible) })}</p>
            </div>
          )}
          {c.status === "active" && (
            <p className="text-sm text-ink-700">{t("groupProgress", { done: formatNumber(c.group_done_today), joined: formatNumber(c.group_joined) })}</p>
          )}
          <ChallengeActions challengeId={c.id} joined={c.joined} />
        </section>
      ))}
    </main>
  );
}
