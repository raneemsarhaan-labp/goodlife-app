import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PERIODS, type Period } from "@/lib/period";

/** «أسبوع · شهر · سنة»: the design's pill switch in the period card's head, as links. */
export async function PeriodTabs({ active, basePath }: { active: Period; basePath: string }) {
  const t = await getTranslations("stats");
  return (
    <nav aria-label={t("periodsLabel")}>
      <ul className="sc-pills">
        {PERIODS.map((p) => (
          <li key={p}>
            <Link href={`${basePath}?period=${p}`} aria-current={p === active ? "page" : undefined} className="sc-pill">
              {t(`periods.${p}`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
