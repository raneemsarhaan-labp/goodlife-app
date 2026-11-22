import { pageTitle } from "@/i18n/metadata";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { localDate } from "@/lib/journey";
import { createClient } from "@/lib/supabase/server";
import { localDateSchema } from "@/lib/validation/common";
import { deleteReflection } from "@/server/actions/reflections";
import { requireUser } from "@/server/auth";
import { icon } from "@/ui/icons";

export const generateMetadata = pageTitle("reflections");

const DAYS = 30;

type Row = { local_date: string; kind: "pause" | "closing"; id: string | null; text: string; desired_state_snapshot: string | null; created_at: string };

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** «تأمّلاتي»: «وقفة تأمل» notes and «ختام اليوم» reflections by date, private (spec 003 FR-004–FR-006). */
export default async function ReflectionsPage({ searchParams }: { searchParams: Promise<{ before?: string }> }) {
  const user = await requireUser();
  const today = localDate(user.timeZone);
  const t = await getTranslations("reflections");
  const before = localDateSchema.safeParse((await searchParams).before);
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_reflections", { p_before: before.success ? before.data : undefined, p_days: DAYS });
  const rows = (data ?? []) as Row[];
  const byDate = new Map<string, Row[]>();
  for (const r of rows) byDate.set(r.local_date, [...(byDate.get(r.local_date) ?? []), r]);
  const top = before.success ? before.data : null;
  const olderBefore = shiftDate(top ?? today, -DAYS);

  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("historyTitle")}</h1>
        <p className="text-ink-700">{t("historyIntro")}</p>
      </header>
      {byDate.size === 0 && (
        <Card>
          <p className="text-ink-700">{t("none")}</p>
        </Card>
      )}
      {[...byDate.entries()].map(([date, items]) => (
        <section key={date} aria-labelledby={`d-${date}`} className="flex flex-col gap-2">
          <h2 id={`d-${date}`} className="text-sm font-semibold text-ink-700">{formatDate(date)}</h2>
          <ul className="flex flex-col gap-2">
            {items.map((r, i) => (
              <li key={r.id ?? `${date}-closing-${i}`} className="gl-surface flex flex-col gap-2 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${r.kind === "pause" ? "bg-gold-100 text-ink-900" : "bg-sage-100 text-ink-900"}`}>
                    {r.kind === "pause" ? t("kindPause") : t("kindClosing")}
                  </span>
                  {r.kind === "pause" && r.id && (
                    <form action={deleteReflection}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" aria-label={t("delete")} title={t("delete")} className="flex size-11 items-center justify-center rounded-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={icon("delete")} alt="" aria-hidden="true" width={20} height={20} className="size-5 opacity-70" />
                      </button>
                    </form>
                  )}
                </div>
                <p className="whitespace-pre-line leading-loose text-ink-900">{r.text}</p>
                {r.kind === "pause" && r.desired_state_snapshot && (
                  <p className="line-clamp-2 text-sm text-ink-500">{t("onState", { text: r.desired_state_snapshot })}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <nav aria-label={t("historyTitle")} className="flex justify-between pb-6">
        <Link href={`/plan/reflections?before=${olderBefore}`} className="min-h-11 py-2 text-sage-700 underline underline-offset-4">{t("older")}</Link>
        {top && (
          <Link href={`/plan/reflections${shiftDate(top, DAYS) < today ? `?before=${shiftDate(top, DAYS)}` : ""}`} className="min-h-11 py-2 text-sage-700 underline underline-offset-4">
            {t("newer")}
          </Link>
        )}
      </nav>
    </main>
  );
}
