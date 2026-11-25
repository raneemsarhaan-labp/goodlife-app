import { pageTitle } from "@/i18n/metadata";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SignUpForm } from "@/components/features/auth/SignUpForm";

export const generateMetadata = pageTitle("join");

/** New account: name, email, mobile. */
export default async function JoinPage() {
  const t = await getTranslations("join");
  return (
    <main id="main" className="au-page">
      <SignUpForm>
        <p className="au-switch">
          {t("haveAccount")} <Link href="/sign-in">{t("signInLink")}</Link>
        </p>
      </SignUpForm>
    </main>
  );
}
