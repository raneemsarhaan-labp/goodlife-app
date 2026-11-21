import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { ChallengesTab } from "@/components/features/admin/content/ChallengesTab";
import { ClosingTab } from "@/components/features/admin/content/ClosingTab";
import { GuidelinesTab } from "@/components/features/admin/content/GuidelinesTab";
import { PhrasesTab } from "@/components/features/admin/content/PhrasesTab";
import { QuestionsTab } from "@/components/features/admin/content/QuestionsTab";
import { StagesTab } from "@/components/features/admin/content/StagesTab";

export const metadata = { title: "المحتوى" };

/** Program content managed by admins (FR-063). Tabs are added by later stories. */
const TABS: Record<string, (params: { page: number }) => ReactNode> = {
  challenges: ({ page }) => <ChallengesTab page={page} />,
  closing: () => <ClosingTab />,
  questions: () => <QuestionsTab />,
  phrases: () => <PhrasesTab />,
  stages: () => <StagesTab />,
  guidelines: () => <GuidelinesTab />,
};

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string }> }) {
  const { tab = "challenges", page = "1" } = await searchParams;
  const t = await getTranslations("admin.content");
  const active = tab in TABS ? tab : "challenges";
  const pageNumber = Math.min(Math.max(Number.parseInt(page, 10) || 1, 1), 13);
  return (
    <>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <nav aria-label={t("title")}>
        <ul className="flex flex-wrap gap-2">
          {Object.keys(TABS).map((key) => (
            <li key={key}>
              <Link
                href={`/admin/content?tab=${key}`}
                aria-current={key === active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm ${key === active ? "bg-ink-900 text-white" : "bg-white ring-1 ring-sand-200"}`}
              >
                {t(`tabs.${key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {TABS[active]!({ page: pageNumber })}
    </>
  );
}
