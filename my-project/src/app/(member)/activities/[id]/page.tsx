import { pageTitle } from "@/i18n/metadata";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RegistrationButton } from "@/components/features/activities/RegistrationButton";
import { Registrants } from "@/components/features/activities/Registrants";
import { Card } from "@/components/ui/Card";
import { formatDateTime, formatNumber } from "@/lib/format";
import { uuidSchema } from "@/lib/validation/common";
import { requireUser } from "@/server/auth";
import { getActivityDetails, getRegistrants } from "@/server/queries/activity";
import { icon } from "@/ui/icons";

export const generateMetadata = pageTitle("activity");

/** Activity details and registration (spec 003 US2, FR-011–FR-014, FR-017). */
export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = uuidSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const a = await getActivityDetails(id.data);
  if (!a) notFound();
  const t = await getTranslations("activityRegistration");
  const organizer = user.roles.includes("admin") || user.roles.includes("facilitator");
  const registrants = organizer && a.registration_open ? await getRegistrants(a.id) : null;
  const full = a.places_left === 0;
  const canRegister = a.registration_open && a.window_open && !full && !a.cancelled_at;

  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <header className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-sage-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon(a.mode === "online" ? "videocam" : "location_on")} alt="" aria-hidden="true" width={18} height={18} className="size-[18px]" />
          {a.mode === "online" ? t("online") : t("inPerson")} · {t("sessions", { count: a.sessions.length })}
        </p>
        <h1 className="text-2xl font-semibold">{a.title}</h1>
        {a.cancelled_at && <p role="status" className="font-semibold text-dawn-700">{t("activityCancelled")}</p>}
      </header>

      {a.description && (
        <Card>
          <p className="whitespace-pre-line leading-loose">{a.description}</p>
        </Card>
      )}

      <Card aria-labelledby="sessions" className="flex flex-col gap-3">
        <h2 id="sessions" className="text-lg font-semibold">{t("sessionsTitle")}</h2>
        <ol className="flex flex-col gap-2">
          {a.sessions.map((s, i) => (
            <li key={s.starts_at} className={`flex items-center justify-between gap-3 ${s.past ? "text-ink-500" : ""}`}>
              <span>
                {formatNumber(i + 1)}. {formatDateTime(s.starts_at, user.timeZone)}
              </span>
              {s.past && <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs text-ink-900">{t("sessionPast")}</span>}
            </li>
          ))}
        </ol>
        {a.mode === "in_person" && a.location && <p className="text-ink-700">{t("place", { place: a.location })}</p>}
        {a.mode === "online" &&
          (a.meeting_url ? (
            <a href={a.meeting_url} target="_blank" rel="noopener noreferrer" dir="ltr" className="self-start break-all text-sage-700 underline underline-offset-4">
              {t("link")}
            </a>
          ) : (
            <p className="text-sm text-ink-700">{t("linkAfterRegistering")}</p>
          ))}
      </Card>

      <Card className="flex flex-col gap-3">
        {!a.registration_open ? (
          <p className="text-ink-700">{t("noRegistration")}</p>
        ) : (
          <>
            <p className="text-ink-700">{a.places_left === null ? t("unlimited") : t("placesLeft", { count: a.places_left })}</p>
            {!a.registered && full && <p className="font-semibold text-dawn-700">{t("full")}</p>}
            {!a.registered && !a.window_open && !a.cancelled_at && <p className="text-ink-700">{t("closed")}</p>}
            {(a.registered ? a.window_open || Boolean(a.cancelled_at) : canRegister) && (
              <RegistrationButton activityId={a.id} registered={a.registered} canRegister={canRegister} />
            )}
          </>
        )}
      </Card>

      {registrants && <Registrants rows={registrants} scope={user.roles.includes("admin") ? "admin" : "facilitator"} timeZone={user.timeZone} />}
    </main>
  );
}
