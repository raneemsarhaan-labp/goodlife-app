import { pageTitle } from "@/i18n/metadata";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DeleteRequest } from "@/components/features/account/DeleteRequest";
import { ExportButton } from "@/components/features/account/ExportButton";
import { ProfileEditForm } from "@/components/features/account/ProfileEditForm";
import { ActionForm } from "@/components/ui/ActionForm";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { Card, CardTitle } from "@/components/ui/Card";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher";
import { SubHeader } from "@/components/features/screens/ScreenHeader";
import { createClient } from "@/lib/supabase/server";
import { setOwnPassword } from "@/server/actions/account";
import { signOut } from "@/server/actions/onboarding";
import { requireUser } from "@/server/auth";

export const generateMetadata = pageTitle("account");

/** «حسابي» (FR-070, FR-071). */
export default async function AccountPage() {
  const user = await requireUser();
  const t = await getTranslations("account");
  const supabase = await createClient();
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("users").select("full_name, email, phone, gender, city, time_zone, deletion_requested_at").eq("id", user.id).single(),
    supabase.from("group_memberships").select("groups(name, cohorts(name))").eq("user_id", user.id).eq("role", "member").is("ended_on", null).maybeSingle(),
  ]);
  return (
    <main id="main" className="sc-page is-sub">
      <SubHeader title={t("title")} subtitle={t("subtitle")} backHref="/more" />
      <div className="sc-content sc-forms">
      <Card aria-labelledby="journey" className="flex flex-col gap-2">
        <CardTitle id="journey">{t("journeyTitle")}</CardTitle>
        {membership?.groups ? (
          <>
            <p>{t("cohort", { name: membership.groups.cohorts?.name ?? "" })}</p>
            <p>{t("group", { name: membership.groups.name })}</p>
          </>
        ) : (
          <p className="text-ink-500">{t("noJourney")}</p>
        )}
        <Link href="/account/archived-habits" className="text-sage-700 underline underline-offset-4">{t("archivedHabits")}</Link>
      </Card>
      <Link href="/account/appearance" className="gl-surface flex min-h-14 items-center rounded-[var(--radius-card)] px-5 text-lg">
        {t("appearanceLink")}
      </Link>
      {user.roles.length > 1 && (
        <Card aria-labelledby="roles">
          <CardTitle id="roles" className="mb-2">{t("rolesTitle")}</CardTitle>
          <RoleSwitcher roles={user.roles} active={user.activeRole} />
        </Card>
      )}
      {profile && (
        <Card aria-labelledby="profile">
          <CardTitle id="profile" className="mb-3">{t("profileTitle")}</CardTitle>
          <ProfileEditForm profile={profile} zones={Intl.supportedValuesOf("timeZone")} />
        </Card>
      )}
      <Card aria-labelledby="password" className="flex flex-col gap-3">
        <CardTitle id="password">{t("passwordTitle")}</CardTitle>
        <p className="text-sm text-ink-700">{t("passwordIntro")}</p>
        <ActionForm
          action={setOwnPassword}
          submitLabel={t("passwordSave")}
          resetOnSuccess
          successText={t("passwordSaved")}
          fieldErrors={{ "password:invalid_input": t("passwordShort"), "confirmPassword:invalid_input": t("passwordMismatch") }}
        >
          <PasswordField name="password" label={t("passwordNew")} hint={t("passwordHint")} autoComplete="new-password" required minLength={8} />
          <PasswordField name="confirmPassword" label={t("passwordConfirm")} autoComplete="new-password" required />
        </ActionForm>
      </Card>
      <Card aria-labelledby="privacy" className="flex flex-col gap-3">
        <CardTitle id="privacy">{t("privacyTitle")}</CardTitle>
        <p className="text-sm text-ink-700">{t("exportHint")}</p>
        <ExportButton />
        <DeleteRequest requested={Boolean(profile?.deletion_requested_at)} />
      </Card>
      <form action={signOut}>
        <Button type="submit" variant="secondary">{t("signOut")}</Button>
      </form>
      </div>
    </main>
  );
}
