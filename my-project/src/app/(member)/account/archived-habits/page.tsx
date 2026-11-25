import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { SubHeader } from "@/components/features/screens/ScreenHeader";
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
    <main id="main" className="sc-page is-sub">
      <SubHeader title={t("archivedTitle")} backHref="/account" />
      <div className="sc-content">
      {(habits ?? []).length === 0 ? (
        <p className="sc-text sc-muted">{t("noArchived")}</p>
      ) : (
        <ul className="sc-rows">
          {(habits ?? []).map((h) => (
            <li key={h.id} className="sc-row">
              <div className="sc-row-text">
                <p className="sc-row-name">{h.name}</p>
                <p className="sc-row-sub">{t("archivedOn", { date: formatDate(localDate(user.timeZone, new Date(h.archived_at!)), { withYear: true }) })}</p>
              </div>
              <form action={restoreHabit}>
                <input type="hidden" name="id" value={h.id} />
                <Button type="submit" variant="secondary">{t("restore")}</Button>
              </form>
            </li>
          ))}
        </ul>
      )}
      </div>
    </main>
  );
}
