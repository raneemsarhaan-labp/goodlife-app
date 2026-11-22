import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher";
import { requireRole } from "@/server/auth";

const SECTIONS = [
  { href: "/admin", key: "home" },
  { href: "/admin/cohorts", key: "cohorts" },
  { href: "/admin/invitations", key: "invitations" },
  { href: "/admin/activities", key: "activities" },
  { href: "/admin/challenges", key: "challenges" },
  { href: "/admin/resources", key: "resources" },
  { href: "/admin/content", key: "content" },
] as const;

/** «لوحة الإدارة» shell; admin only (404 for everyone else). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");
  const t = await getTranslations("admin");
  return (
    <div data-area="admin" className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-5 pb-16 pt-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold text-sage-700">{t("title")}</p>
          <RoleSwitcher roles={user.roles} active={user.activeRole} />
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
