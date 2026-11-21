import { pageTitle } from "@/i18n/metadata";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClass } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth";

export const generateMetadata = pageTitle("welcome");

export default async function WelcomePage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_memberships")
    .select("groups(name)")
    .eq("user_id", user.id)
    .eq("role", "member")
    .is("ended_on", null)
    .maybeSingle();
  const t = await getTranslations("welcome");
  return (
    <main id="main" className="flex flex-col gap-6 text-center">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="leading-loose text-ink-700">{t("body")}</p>
      {data?.groups?.name && <p className="rounded-2xl bg-sage-50 p-4 text-sage-700">{t("group", { group: data.groups.name })}</p>}
      <Link href={user.uiChosenAt ? "/" : "/setup/look"} className={buttonClass("primary")}>
        {t("start")}
      </Link>
    </main>
  );
}
