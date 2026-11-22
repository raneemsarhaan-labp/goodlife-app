import { pageTitle } from "@/i18n/metadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Registrants } from "@/components/features/activities/Registrants";
import { formatDateTime, formatNumber } from "@/lib/format";
import { uuidSchema } from "@/lib/validation/common";
import { requireRole } from "@/server/auth";
import { getActivityDetails, getRegistrants } from "@/server/queries/activity";

export const generateMetadata = pageTitle("adminActivity");

/** Registrations of one activity for admins (spec 003 FR-017), on solid surfaces. */
export default async function AdminActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("admin");
  const id = uuidSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const a = await getActivityDetails(id.data);
  if (!a) notFound();
  const [t, ta, rows] = await Promise.all([getTranslations("activityRegistration"), getTranslations("admin.activities"), getRegistrants(a.id)]);
  return (
    <>
      <Link href="/admin/activities" className="self-start text-sage-700 underline underline-offset-4">{ta("title")}</Link>
      <h1 className="text-2xl font-semibold">{a.title}</h1>
      <p className="text-ink-700">
        {a.mode === "online" ? t("online") : t("inPerson")} · {t("sessions", { count: a.sessions.length, n: formatNumber(a.sessions.length) })}
        {a.sessions[0] && ` · ${formatDateTime(a.sessions[0].starts_at, user.timeZone)}`}
      </p>
      <p className="text-ink-700">{a.places_left === null ? t("unlimited") : t("placesLeft", { count: a.places_left, n: formatNumber(a.places_left) })}</p>
      <Registrants rows={rows} scope="admin" timeZone={user.timeZone} />
    </>
  );
}
