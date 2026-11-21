import { getTranslations } from "next-intl/server";
import { NewHabitForm } from "@/components/features/today/NewHabitForm";
import { Sheet } from "@/components/ui/Sheet";

export const metadata = { title: "عادة جديدة" };

export default async function NewHabitPage() {
  const t = await getTranslations("habits");
  return (
    <Sheet title={t("newTitle")}>
      <NewHabitForm />
    </Sheet>
  );
}
