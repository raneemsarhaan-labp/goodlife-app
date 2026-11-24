import { pageTitle } from "@/i18n/metadata";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SignUpForm } from "@/components/features/auth/SignUpForm";

export const generateMetadata = pageTitle("join");

/** New account: name, mobile, password. */
export default async function JoinPage() {
  const t = await getTranslations("join");
  return (
    <main id="main" className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-ink-700">{t("intro")}</p>
      <SignUpForm />
      <p className="text-center text-ink-700">
        {t("haveAccount")}{" "}
        <Link href="/sign-in" className="font-medium text-sage-700 underline underline-offset-4">
          {t("signInLink")}
        </Link>
      </p>
    </main>
  );
}
