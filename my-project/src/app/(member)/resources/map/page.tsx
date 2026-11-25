import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { SubHeader } from "@/components/features/screens/ScreenHeader";
import { formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getToday } from "@/server/queries/today";

export const generateMetadata = pageTitle("journeyMap");

/** Journey map: all stages with the current one highlighted (FR-007). Not drawn in the design; uses its sub-page and cards. */
export default async function JourneyMapPage() {
  const t = await getTranslations("resources");
  const supabase = await createClient();
  const [{ data: stages }, today] = await Promise.all([
    supabase.from("journey_stages").select("id, title, description, from_day, to_day").order("from_day"),
    getToday(),
  ]);
  const day = today?.journey_status === "active" ? today.journey_day : undefined;
  return (
    <main id="main" className="sc-page is-sub">
      <SubHeader title={t("mapTitle")} subtitle={t("mapIntro")} backHref="/resources" />
      <div className="sc-content">
        {(stages ?? []).length === 0 ? (
          <p className="sc-text sc-muted">{t("noStages")}</p>
        ) : (
          <ol className="sc-rows">
            {(stages ?? []).map((s) => {
              const current = day !== undefined && day >= s.from_day && day <= s.to_day;
              return (
                <li key={s.id} aria-current={current ? "step" : undefined} className="sc-card sc-item" style={current ? { boxShadow: "inset 0 0 0 2px var(--green-700)" } : undefined}>
                  <p>{t("stageDays", { from: formatNumber(s.from_day), to: formatNumber(s.to_day) })}</p>
                  <h2 className="sc-h" style={{ margin: 0 }}>{s.title}</h2>
                  {s.description && <p>{s.description}</p>}
                  {current && <p style={{ color: "var(--green-700)", fontWeight: 700 }}>{t("youAreHere")}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </main>
  );
}
