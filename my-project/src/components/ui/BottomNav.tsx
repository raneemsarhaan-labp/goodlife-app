"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { icon, type IconName } from "@/ui/icons";

type Tab = { href: string; key: "today" | "plan" | "stats" | "community" | "more"; icon: IconName };

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

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  return (
    <nav
      aria-label={t("label")}
      className="gl-nav fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-lg justify-between px-2">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.key} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${
                  active ? "font-semibold text-sage-700" : "text-ink-500"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- inline icon data URL */}
                <img src={icon(tab.icon)} alt="" aria-hidden="true" width={24} height={24} className={`size-6 ${active ? "" : "opacity-70"}`} />
                {t(tab.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
