import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireUser } from "@/server/auth";
import { getMyGroups } from "@/server/queries/community";

export const metadata = { title: "مجموعاتي" };

/** «مجموعاتي»: groups led and the group belonged to, labelled by role (FR-042). */
export default async function MyGroupsPage() {
  const user = await requireUser();
  const [t, groups] = await Promise.all([getTranslations("groups"), getMyGroups(user.id)]);
  const sorted = [...groups].sort((a, b) => (a.role === b.role ? a.groupName.localeCompare(b.groupName, "ar") : a.role === "facilitator" ? -1 : 1));
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-ink-700">{t("intro")}</p>
      </header>
      {sorted.length === 0 && <EmptyState title={t("none")} />}
      <ul className="flex flex-col gap-3">
        {sorted.map((g) => (
          <li key={`${g.groupId}-${g.role}`}>
            <Card className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{g.groupName}</p>
                <p className="text-sm text-ink-700">{g.cohortName}</p>
                <p className={`mt-1 w-fit rounded-full px-2 py-0.5 text-xs ${g.role === "facilitator" ? "bg-sage-50 text-sage-700" : "bg-sand-100 text-ink-700"}`}>
                  {g.role === "facilitator" ? t("roleFacilitator") : t("roleMember")}
                </p>
              </div>
              <Link href={g.role === "facilitator" ? `/groups/${g.groupId}` : "/community"} className="text-sage-700 underline underline-offset-4" aria-label={`${t("open")}: ${g.groupName}`}>
                {g.role === "facilitator" ? t("open") : t("openCommunity")}
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
