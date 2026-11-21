import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClass } from "@/components/ui/Button";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">{t("notAvailableTitle")}</h1>
      <p className="text-ink-700">{t("notAvailableBody")}</p>
      <Link href="/" className={buttonClass("primary")}>
        {t("goHome")}
      </Link>
    </main>
  );
}
