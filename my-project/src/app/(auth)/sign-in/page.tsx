import { pageTitle } from "@/i18n/metadata";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SignInForm } from "@/components/features/auth/SignInForm";

export const generateMetadata = pageTitle("signIn");

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ link?: string }> }) {
  const t = await getTranslations("signIn");
  const { link } = await searchParams;
  return (
    <main id="main" className="flex flex-col gap-6">
      {link === "expired" && (
        <p role="alert" className="rounded-2xl bg-dawn-50 p-4 text-ink-900">
          {t("linkExpired")}
        </p>
      )}
      <SignInForm />
      <p className="text-center text-ink-700">
        {t("noAccount")}{" "}
        <Link href="/join" className="font-medium text-sage-700 underline underline-offset-4">
          {t("joinLink")}
        </Link>
      </p>
    </main>
  );
}
