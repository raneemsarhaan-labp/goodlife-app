import { getTranslations } from "next-intl/server";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { Registrant } from "@/server/queries/activity";

/** Who registered (spec 003 FR-017). The list is already scoped in SQL to what the viewer may see. */
export async function Registrants({ rows, scope, timeZone }: { rows: Registrant[]; scope: "admin" | "facilitator"; timeZone: string }) {
  const t = await getTranslations("activityRegistration");
  const count = formatNumber(rows.length);
  return (
    <section aria-labelledby="registrants" className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-sand-200 bg-white p-5">
      <h2 id="registrants" className="text-lg font-semibold">
        {scope === "admin" ? t("registrantsTitle", { count }) : t("registrantsFacilitator", { count })}
      </h2>
      {rows.length === 0 ? (
        <p className="text-ink-700">{t("noRegistrants")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-sand-200">
          {rows.map((r) => (
            <li key={r.user_id} className="flex flex-col py-2">
              <span className="font-medium">{r.full_name}</span>
              <span className="text-sm text-ink-700">
                {r.group_name ? `${r.group_name} · ` : ""}
                {formatDateTime(r.registered_at, timeZone)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
