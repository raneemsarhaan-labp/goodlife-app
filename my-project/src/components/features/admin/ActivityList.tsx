import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, formatNumber } from "@/lib/format";
import { cancelActivity } from "@/server/actions/activities";

export type ActivityRow = {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
  cancelled_at: string | null;
  audience: string;
  editable: boolean;
  registration_open?: boolean;
  /** Active registrations visible to the viewer (spec 003 FR-017). */
  registered?: number;
};

export async function ActivityList({
  rows,
  timeZone,
  editHref,
  registrationsHref,
}: {
  rows: ActivityRow[];
  timeZone: string;
  editHref: (id: string) => string;
  registrationsHref?: (id: string) => string;
}) {
  const t = await getTranslations("admin.activities");
  if (rows.length === 0) return <EmptyState title={t("none")} />;
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((a) => (
        <li key={a.id} className={`flex flex-col gap-1 rounded-2xl gl-surface p-4 ${a.cancelled_at ? "opacity-60" : ""}`}>
          <p className="font-medium">
            {a.title} {a.cancelled_at && <span className="text-sm text-dawn-700">({t("cancelled")})</span>}
          </p>
          <p className="text-sm text-ink-700">{formatDateTime(a.starts_at, timeZone)}</p>
          {a.location && <p className="text-sm text-ink-500">{a.location}</p>}
          {a.audience && <p className="text-sm text-ink-500">{a.audience}</p>}
          {a.registration_open && registrationsHref && (
            <Link href={registrationsHref(a.id)} className="self-start text-sm text-sage-700 underline underline-offset-4">
              {t("registeredCount", { count: formatNumber(a.registered ?? 0) })}
            </Link>
          )}
          {a.editable && !a.cancelled_at && (
            <div className="flex gap-2">
              <Link href={editHref(a.id)} className="inline-flex min-h-11 items-center text-sage-700 underline underline-offset-4">
                {t("edit")}
              </Link>
              <form action={cancelActivity}>
                <input type="hidden" name="id" value={a.id} />
                <Button type="submit" variant="quiet">{t("cancel")}</Button>
              </form>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
