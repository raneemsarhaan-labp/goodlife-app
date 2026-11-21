import { getTranslations } from "next-intl/server";

/** Calm, centered frame for joining and signing in. */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("common");
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-10 pt-12">
      <p className="mb-8 text-center text-lg font-semibold text-sage-700">{t("appName")}</p>
      {children}
    </div>
  );
}
