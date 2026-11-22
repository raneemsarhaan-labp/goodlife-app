import Link from "next/link";
import { getTranslations } from "next-intl/server";

/** «أنا / مجموعتي / التحدّي» (spec 007): the design's «أثرك» tabs as links. */
export async function StatsTabs({ active }: { active: "me" | "group" | "challenge" }) {
  const t = await getTranslations("together");
  const tabs = [
    { key: "me", href: "/stats" },
    { key: "group", href: "/stats/group" },
    { key: "challenge", href: "/stats/challenge" },
  ] as const;
  return (
    <nav aria-label={t("tabsLabel")}>
      <ul className="flex gap-2">
        {tabs.map((tab) => (
          <li key={tab.key} className="flex-1">
            <Link
              href={tab.href}
              aria-current={active === tab.key ? "page" : undefined}
              className={`flex min-h-11 items-center justify-center rounded-full text-sm font-medium ${active === tab.key ? "bg-ink-900 text-white" : "gl-surface text-ink-700 ring-1 ring-sand-200"}`}
            >
              {t(`tabs.${tab.key}`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
