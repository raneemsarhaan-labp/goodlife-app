"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { navIcon, type NavIconName } from "@/ui/icons";
import { Icon } from "@/ui/components/Icon";

type Tab = { href: string; key: "today" | "plan" | "stats" | "community" | "more"; icon: NavIconName };

// RTL order (right → left): يومي · خطتي · الإحصاءات · المجتمع · المزيد (contracts/routes.md).
// Semantic <nav> with links (page navigation), themed by the chosen version (spec 002).
const TABS: Tab[] = [
  { href: "/", key: "today", icon: "check_box" },
  { href: "/plan", key: "plan", icon: "star" },
  { href: "/stats", key: "stats", icon: "bar_chart" },
  { href: "/community", key: "community", icon: "groups" },
  { href: "/more", key: "more", icon: "more_horiz" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** `current` stands in for the path in development previews (which live under /dev). */
export function BottomNav({ current }: { current?: string } = {}) {
  const path = usePathname();
  const pathname = current ?? path;
  const t = useTranslations("nav");
  return (
    <nav aria-label={t("label")} className="gl-nav fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-lg px-1.5">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.key} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[65px] flex-col items-center gap-1 pb-3.5 pt-2.5 text-[11px] font-bold leading-[15px] ${
                  active ? "text-sage-700" : "text-ink-500"
                }`}
              >
                <Icon src={navIcon(tab.icon)} className={`size-[22px] ${active ? "" : "text-[var(--ink-300)]"}`} />
                {t(tab.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
