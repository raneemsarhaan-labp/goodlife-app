import { pageTitle } from "@/i18n/metadata";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SignInForm } from "@/components/features/auth/SignInForm";

export const generateMetadata = pageTitle("signIn");

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ link?: string }> }) {
  const t = await getTranslations("signIn");
  const { link } = await searchParams;
  return (
    <main id="main" className="au-page">
      <SignInForm
        notice={
          link === "expired" && (
            <p role="alert" className="au-notice">
              {t("linkExpired")}
            </p>
          )
        }
      >
        <p className="au-switch">
          {t("noAccount")} <Link href="/join">{t("joinLink")}</Link>
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative art, as on «يومك» */}
        <img src="/design/progress-journey.webp" alt="" width={190} height={127} className="au-art" />
      </SignInForm>
    </main>
  );
}
