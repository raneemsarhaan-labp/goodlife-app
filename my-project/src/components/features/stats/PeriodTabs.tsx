import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PERIODS, type Period } from "@/lib/period";

export async function PeriodTabs({ active, basePath }: { active: Period; basePath: string }) {
  const t = await getTranslations("stats");
  return (
    <nav aria-label={t("periodsLabel")}>
      <ul className="flex gap-2">
        {PERIODS.map((p) => (
          <li key={p}>
            <Link
              href={`${basePath}?period=${p}`}
              aria-current={p === active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm ${p === active ? "bg-ink-900 text-white" : "bg-white ring-1 ring-sand-200"}`}
            >
              {t(`periods.${p}`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
