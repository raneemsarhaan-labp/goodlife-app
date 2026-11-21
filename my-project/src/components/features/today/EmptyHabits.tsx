import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export async function EmptyHabits() {
  const t = await getTranslations("today");
  return (
    <EmptyState
      title={t("noHabitsTitle")}
      body={t("noHabitsBody")}
      action={
        <Link href="/habits/new" className={buttonClass("primary")}>
          {t("addHabit")}
        </Link>
      }
    />
  );
}
