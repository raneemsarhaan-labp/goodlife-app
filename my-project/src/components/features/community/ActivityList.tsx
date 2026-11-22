import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { RegistrationButton } from "@/components/features/activities/RegistrationButton";
import { formatDateTime, formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type CommunityItem = {
  id: string; title: string; description: string | null; mode: "in_person" | "online"; presenter: string | null; location: string | null;
  next_starts_at: string; session_count: number; registration_open: boolean; registered: boolean; places_left: number | null;
  window_open: boolean; is_new: boolean;
};

/** «أنشطة قادمة» (spec 007 US3): every upcoming activity the member may see. */
export async function ActivityList({ timeZone }: { timeZone: string }) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("community_activities");
  return <ActivityListView items={(data ?? []) as unknown as CommunityItem[]} timeZone={timeZone} />;
}

/** The list itself, with badges and inline registration; props only. */
export async function ActivityListView({ items, timeZone }: { items: CommunityItem[]; timeZone: string }) {
  const [t, tr] = await Promise.all([getTranslations("communityList"), getTranslations("activityRegistration")]);
  return (
    <section aria-labelledby="activities-list" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="activities-list" className="text-xl font-semibold">{t("title")}</h2>
        <span className="rounded-full bg-sand-100 px-3 py-1 text-sm font-semibold">{formatNumber(items.length)}</span>
      </div>
      <p className="text-ink-700">{t("intro")}</p>
      {items.length === 0 && <p className="text-ink-700">{t("empty")}</p>}
      <ul className="flex flex-col gap-3">
        {items.map((a) => (
          <li key={a.id}>
            <details className="gl-surface rounded-[var(--radius-card)] p-4">
              <summary className="flex min-h-12 cursor-pointer flex-col gap-1">
                <span className="flex flex-wrap gap-1.5">
                  {a.is_new && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-semibold text-ink-900">{t("new")}</span>}
                  <span className="rounded-full bg-sand-100 px-2 py-0.5 text-xs font-semibold text-ink-900">{a.mode === "online" ? tr("online") : tr("inPerson")}</span>
                  {a.registered && <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs font-semibold text-ink-900">{t("registered")}</span>}
                </span>
                <span className="font-semibold text-ink-900">{a.title}</span>
                <span className="text-sm text-ink-700">
                  {formatDateTime(a.next_starts_at, timeZone)}
                  {a.session_count > 1 && ` · ${tr("sessions", { count: a.session_count, n: formatNumber(a.session_count) })}`}
                </span>
              </summary>
              <div className="mt-3 flex flex-col gap-2">
                {a.description && <p className="whitespace-pre-line text-ink-900">{a.description}</p>}
                {a.presenter && <p className="text-sm text-ink-700">{t("presenter", { name: a.presenter })}</p>}
                {a.location && <p className="text-sm text-ink-700">{tr("place", { place: a.location })}</p>}
                {a.registration_open && (
                  <>
                    <p className="text-sm text-ink-700">{a.places_left === null ? tr("unlimited") : tr("placesLeft", { count: a.places_left, n: formatNumber(a.places_left) })}</p>
                    {(a.registered || (a.window_open && a.places_left !== 0)) && (
                      <RegistrationButton activityId={a.id} registered={a.registered} canRegister={a.window_open && a.places_left !== 0} />
                    )}
                  </>
                )}
                <Link href={`/activities/${a.id}`} className="self-start text-sm text-sage-700 underline underline-offset-4">{t("details")}</Link>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
