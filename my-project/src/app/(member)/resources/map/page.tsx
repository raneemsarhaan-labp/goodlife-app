import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getToday } from "@/server/queries/today";

export const metadata = { title: "خريطة الرحلة" };

/** Journey map: all stages with the current one highlighted (FR-007). */
export default async function JourneyMapPage() {
  const t = await getTranslations("resources");
  const supabase = await createClient();
  const [{ data: stages }, today] = await Promise.all([
    supabase.from("journey_stages").select("id, title, description, from_day, to_day").order("from_day"),
    getToday(),
  ]);
  const day = today?.journey_status === "active" ? today.journey_day : undefined;
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("mapTitle")}</h1>
        <p className="text-ink-700">{t("mapIntro")}</p>
      </header>
      {(stages ?? []).length === 0 ? (
        <EmptyState title={t("noStages")} />
      ) : (
        <ol className="relative flex flex-col gap-4 border-s-2 border-sage-100 ps-6">
          {(stages ?? []).map((s) => {
            const current = day !== undefined && day >= s.from_day && day <= s.to_day;
            return (
              <li key={s.id} aria-current={current ? "step" : undefined} className={`relative rounded-2xl border p-4 ${current ? "border-sage-600 bg-sage-50" : "border-sand-200 bg-white"}`}>
                <span aria-hidden="true" className={`absolute -start-[1.95rem] top-5 size-4 rounded-full border-2 ${current ? "border-sage-700 bg-sage-700" : "border-sage-600 bg-white"}`} />
                <p className="text-sm text-ink-500">{t("stageDays", { from: formatNumber(s.from_day), to: formatNumber(s.to_day) })}</p>
                <h2 className="text-lg font-semibold">{s.title}</h2>
                {s.description && <p className="text-ink-700">{s.description}</p>}
                {current && <p className="mt-1 font-medium text-sage-700">{t("youAreHere")}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
