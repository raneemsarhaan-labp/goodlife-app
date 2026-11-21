import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ui/ActionForm";
import { TextArea } from "@/components/ui/Field";
import { formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { upsertJourneyChallenge } from "@/server/actions/admin/content";

const PAGE = 30;

/** One journey challenge per journey day (1–365), 30 days per page. */
export async function ChallengesTab({ page }: { page: number }) {
  const t = await getTranslations("admin.content");
  const ts = await getTranslations("admin");
  const from = (page - 1) * PAGE + 1;
  const to = Math.min(page * PAGE, 365);
  const supabase = await createClient();
  const { data } = await supabase.from("journey_challenges").select("journey_day, text").gte("journey_day", from).lte("journey_day", to);
  const byDay = new Map((data ?? []).map((c) => [c.journey_day, c.text]));
  const pages = Math.ceil(365 / PAGE);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-700">{t("challengesIntro")}</p>
      <p className="font-medium">{t("pageLabel", { from: formatNumber(from), to: formatNumber(to) })}</p>
      <ol className="flex flex-col gap-3">
        {Array.from({ length: to - from + 1 }, (_, i) => from + i).map((day) => (
          <li key={day} className="rounded-2xl gl-surface p-4">
            <ActionForm action={upsertJourneyChallenge} submitLabel={t("save")} successText={ts("saved")} className="flex flex-col gap-2">
              <input type="hidden" name="journeyDay" value={day} />
              <TextArea name="text" label={t("day", { day: formatNumber(day) })} defaultValue={byDay.get(day) ?? ""} maxLength={500} className="min-h-16" />
            </ActionForm>
          </li>
        ))}
      </ol>
      <nav aria-label={t("pageLabel", { from: formatNumber(from), to: formatNumber(to) })} className="flex justify-between">
        {page > 1 ? <Link className="text-sage-700 underline underline-offset-4" href={`/admin/content?tab=challenges&page=${page - 1}`}>{t("previous")}</Link> : <span />}
        {page < pages ? <Link className="text-sage-700 underline underline-offset-4" href={`/admin/content?tab=challenges&page=${page + 1}`}>{t("next")}</Link> : <span />}
      </nav>
    </div>
  );
}
