import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/format";
import { deleteReflection } from "@/server/actions/reflections";
import { icon } from "@/ui/icons";
import { Icon } from "@/ui/components/Icon";
import { FlowHeader } from "../habits/FlowHeader";

export type ReflectionRow = { local_date: string; kind: "pause" | "closing"; id: string | null; text: string; desired_state_snapshot: string | null; created_at: string };

/**
 * «تأمّلاتي» (spec 003 FR-004–FR-006): no screen of its own in the designs, so it takes the review's
 * header and the plan's cards: notes grouped by date, each with its kind, words and the desired state
 * it answered; «وقفة تأمل» notes can be deleted.
 */
export async function ReflectionsView({ rows, olderHref, newerHref }: { rows: ReflectionRow[]; olderHref: string; newerHref: string | null }) {
  const t = await getTranslations("reflections");
  const byDate = new Map<string, ReflectionRow[]>();
  for (const r of rows) byDate.set(r.local_date, [...(byDate.get(r.local_date) ?? []), r]);
  return (
    <main id="main" className="pn-page">
      <FlowHeader
        title={t("historyTitle")}
        sub={t("historyIntro")}
        segments={0}
        on={() => false}
        close={
          <Link href="/plan" className="af-close td-hit" aria-label={t("back")}>
            <Icon src={icon("chevron_left")} />
          </Link>
        }
      />
      <div className="pn-content">
        {byDate.size === 0 && (
          <section className="pn-card">
            <p className="pn-empty-text">{t("none")}</p>
          </section>
        )}
        {[...byDate.entries()].map(([date, items]) => (
          <section key={date} aria-labelledby={`d-${date}`} className="pn-day">
            <h2 id={`d-${date}`}>{formatDate(date)}</h2>
            <ul className="pn-rows">
              {items.map((r, i) => (
                <li key={r.id ?? `${date}-closing-${i}`} className="pn-card pn-reflection">
                  <div className="pn-reflection-head">
                    <span className={`pn-kind ${r.kind === "closing" ? "is-closing" : ""}`}>{r.kind === "pause" ? t("kindPause") : t("kindClosing")}</span>
                    {r.kind === "pause" && r.id && (
                      <form action={deleteReflection}>
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" aria-label={t("delete")} title={t("delete")} className="pn-round td-hit">
                          <Icon src={icon("delete")} />
                        </button>
                      </form>
                    )}
                  </div>
                  <p className="pn-reflection-text">{r.text}</p>
                  {r.kind === "pause" && r.desired_state_snapshot && <p className="pn-reflection-on">{t("onState", { text: r.desired_state_snapshot })}</p>}
                </li>
              ))}
            </ul>
          </section>
        ))}
        <nav aria-label={t("historyTitle")} className="pn-pager">
          <Link href={olderHref} className="pn-link">
            {t("older")}
          </Link>
          {newerHref && (
            <Link href={newerHref} className="pn-link">
              {t("newer")}
            </Link>
          )}
        </nav>
      </div>
    </main>
  );
}
