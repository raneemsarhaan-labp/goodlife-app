import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/features/auth/ProfileForm";
import { createClient } from "@/lib/supabase/server";
import { pendingJoinCode } from "@/server/actions/onboarding";

export const generateMetadata = pageTitle("joinProfile");

export default async function JoinProfilePage() {
  const code = await pendingJoinCode();
  if (!code) redirect("/join");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_invitation", { p_code: code });
  if (error || !data) redirect("/join");
  const t = await getTranslations("join");
  const target = Array.isArray(data) ? data[0] : data;
  return (
    <main id="main" className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("profileTitle")}</h1>
      <p className="rounded-2xl bg-sage-50 p-4 text-sage-700">
        {t("profileIntro", { group: target?.group_name ?? "", cohort: target?.cohort_name ?? "" })}
      </p>
      <ProfileForm />
    </main>
  );
}
