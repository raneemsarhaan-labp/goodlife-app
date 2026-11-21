import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sheet } from "@/components/ui/Sheet";
import { formatDate } from "@/lib/format";
import { localDate } from "@/lib/journey";
import { createClient } from "@/lib/supabase/server";
import { restoreHabit } from "@/server/actions/habits";
import { requireUser } from "@/server/auth";

export const generateMetadata = pageTitle("archivedHabits");

/** Archived habits of the current journey, with restore (FR-022). */
export default async function ArchivedHabitsPage() {
  const user = await requireUser();
  const t = await getTranslations("habits");
  const supabase = await createClient();
  const { data: planId } = await supabase.rpc("current_plan_id");
  const { data: habits } = planId
    ? await supabase.from("habits").select("id, name, archived_at").eq("plan_id", planId).not("archived_at", "is", null).order("archived_at", { ascending: false })
    : { data: [] };
  return (
    <Sheet title={t("archivedTitle")}>
      {(habits ?? []).length === 0 ? (
        <EmptyState title={t("noArchived")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {(habits ?? []).map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 rounded-2xl gl-surface px-4 py-2">
              <div>
                <p>{h.name}</p>
                <p className="text-sm text-ink-500">{t("archivedOn", { date: formatDate(localDate(user.timeZone, new Date(h.archived_at!)), { withYear: true }) })}</p>
              </div>
              <form action={restoreHabit}>
                <input type="hidden" name="id" value={h.id} />
                <Button type="submit" variant="secondary">{t("restore")}</Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
