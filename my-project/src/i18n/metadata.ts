import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LOCALE } from "./request";

/** Page <title> from messages/ar.json › meta (constitution I: no hard-coded UI text). */
export function pageTitle(key: string) {
  return async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations({ locale: LOCALE, namespace: "meta" });
    return { title: t(key) };
  };
}
