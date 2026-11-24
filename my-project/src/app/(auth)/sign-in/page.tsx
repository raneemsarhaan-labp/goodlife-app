import { pageTitle } from "@/i18n/metadata";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SignInForm } from "@/components/features/auth/SignInForm";

export const generateMetadata = pageTitle("signIn");

export default async function SignInPage() {
  const t = await getTranslations("signIn");
  return (
    <main id="main" className="flex flex-col gap-6">
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
