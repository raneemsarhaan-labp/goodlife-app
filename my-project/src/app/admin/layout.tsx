import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/server/auth";

const SECTIONS = [
  { href: "/admin", key: "home" },
  { href: "/admin/cohorts", key: "cohorts" },
  { href: "/admin/invitations", key: "invitations" },
  { href: "/admin/activities", key: "activities" },
  { href: "/admin/content", key: "content" },
] as const;

/** «لوحة الإدارة» shell; admin only (404 for everyone else). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");
  const t = await getTranslations("admin");
  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-5 pb-16 pt-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold text-sage-700">{t("title")}</p>
          <Link href="/" className="text-sm text-sage-700 underline underline-offset-4">
            {t("nav.backToApp")}
          </Link>
        </div>
        <nav aria-label={t("navLabel")}>
          <ul className="flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <li key={s.key}>
                <Link href={s.href} className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm ring-1 ring-sand-200 hover:bg-sage-50">
                  {t(`nav.${s.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" className="flex flex-col gap-6">
        {children}
      </main>
    </div>
  );
}
