import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";

export const generateMetadata = pageTitle("guidelines");

export default async function GuidelinesPage() {
  const t = await getTranslations("resources");
  const supabase = await createClient();
  const { data } = await supabase.from("guidelines").select("number, text").order("number");
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t("guidelinesTitle")}</h1>
        <p className="text-lg leading-loose text-ink-700">{t("guidelinesIntro")}</p>
      </header>
      {(data ?? []).length === 0 ? (
        <EmptyState title={t("noGuidelines")} />
      ) : (
        <ol className="flex flex-col gap-3">
          {(data ?? []).map((g) => (
            <li key={g.number} className="flex gap-3 rounded-2xl border border-sand-200 bg-white p-4">
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-50 font-semibold text-sage-700">
                {new Intl.NumberFormat("ar-u-nu-arab").format(g.number)}
              </span>
              <p className="leading-loose">{g.text}</p>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
