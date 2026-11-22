import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { StatsTabs } from "@/components/features/stats/StatsTabs";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatDate, formatNumber } from "@/lib/format";
import { requireUser } from "@/server/auth";
import { getTogether } from "@/server/queries/together";

export const generateMetadata = pageTitle("statsGroup");

/** «مجموعتي» (spec 007 US1): the group, peers on the same habit, and what you show. */
export default async function GroupTogetherPage() {
  await requireUser();
  const [t, data] = await Promise.all([getTranslations("together"), getTogether()]);
  const peers = new Map<string, { name: string; habits: { habit: string; done: boolean; together: number }[] }>();
  for (const i of data?.items.filter((x) => !x.me) ?? []) {
    const p = peers.get(i.user_id) ?? { name: i.name, habits: [] };
    p.habits.push(i);
    peers.set(i.user_id, p);
  }
  const mine = data?.items.filter((x) => x.me) ?? [];
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <h1 className="text-2xl font-semibold">{t("tabs.group")}</h1>
      <StatsTabs active="group" />
      {!data ? (
        <Card><p>{t("noGroup")}</p></Card>
      ) : (
        <>
          <section aria-labelledby="group-hero" className="flex flex-col gap-1 rounded-[var(--radius-card)] bg-sage-100 p-5">
            <h2 id="group-hero" className="text-xl font-semibold text-ink-900">{data.group.name}</h2>
            <p className="text-ink-900">{t("startedTogether", { date: formatDate(data.group.start_date, { withYear: true, withWeekday: false }) })}</p>
            <p className="text-sm text-ink-700">{t("members", { count: data.group.members, n: formatNumber(data.group.members) })}</p>
          </section>

          <Card aria-labelledby="peers" className="flex flex-col gap-3">
            <CardTitle id="peers">{t("peersTitle")}</CardTitle>
            {!data.sharing ? (
              <p className="text-ink-700">{t("sharingOff")}</p>
            ) : peers.size === 0 ? (
              <p className="text-ink-700">{t("peersEmpty")}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {[...peers.entries()].map(([id, p]) => (
                  <li key={id} className="flex flex-col gap-2">
                    <span className="font-medium text-ink-900">{p.name}</span>
                    <ul className="flex flex-wrap gap-2">
                      {p.habits.map((h) => (
                        <li key={h.habit} className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm text-ink-900 ${h.done ? "bg-sage-100" : "bg-sand-100"}`}>
                          <span aria-hidden="true">{h.done ? "✓" : "○"}</span>
                          <span>{h.habit}</span>
                          <span className="sr-only">: {h.done ? t("doneToday") : t("notYet")}</span>
                          {h.together > 1 && <span className="text-xs text-ink-700">· {t("together", { n: formatNumber(h.together) })}</span>}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card aria-labelledby="you-show" className="flex flex-col gap-2">
            <CardTitle id="you-show">{t("youShowTitle")}</CardTitle>
            <p className="text-ink-900">{mine.length === 0 ? t("youShowNone") : t("youShowList", { list: mine.map((m) => m.habit).join("، ") })}</p>
            <p className="text-sm text-ink-700">{t("youShowNote")}</p>
          </Card>
        </>
      )}
    </main>
  );
}
