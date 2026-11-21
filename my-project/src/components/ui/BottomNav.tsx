"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type Tab = { href: string; key: "today" | "plan" | "stats" | "community" | "more"; icon: string };

// RTL order (right → left): يومك · خطتي · الإحصاءات · المجتمع · المزيد (contracts/routes.md).
const TABS: Tab[] = [
  { href: "/", key: "today", icon: "M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" },
  { href: "/plan", key: "plan", icon: "M5 4h14v16H5zM9 8h6M9 12h6M9 16h3" },
  { href: "/stats", key: "stats", icon: "M5 20V10m7 10V4m7 16v-7" },
  { href: "/community", key: "community", icon: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0m-2 0a6 6 0 0 1 10 0" },
  { href: "/more", key: "more", icon: "M5 12h.01M12 12h.01M19 12h.01" },
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
      className="fixed inset-x-0 bottom-0 z-30 border-t border-sand-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
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
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={tab.icon} />
                </svg>
                {t(tab.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
