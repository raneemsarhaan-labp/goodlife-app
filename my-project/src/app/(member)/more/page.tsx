import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { InstallHint } from "@/components/features/install/InstallHint";
import { Card } from "@/components/ui/Card";
import { requireUser } from "@/server/auth";

export const metadata = { title: "المزيد" };

/** «المزيد» (FR-082). */
export default async function MorePage() {
  const user = await requireUser();
  const t = await getTranslations("more");
  const links = [
    { href: "/resources", key: "resources" },
    { href: "/groups", key: "groups" },
    { href: "/reviews", key: "reviews" },
    { href: "/account", key: "account" },
    ...(user.roles.includes("admin") ? [{ href: "/admin", key: "admin" }] : []),
  ];
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <ul className="flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.key}>
            <Link href={l.href} className="block">
              <Card className="flex min-h-14 items-center py-3 text-lg hover:bg-sage-50">{t(l.key)}</Card>
            </Link>
          </li>
        ))}
      </ul>
      <InstallHint />
    </main>
  );
}
