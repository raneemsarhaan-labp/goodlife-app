import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";
import { LOCALE } from "@/i18n/request";

/** Installable app manifest (FR-081, contracts/routes.md › PWA). */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({ locale: LOCALE, namespace: "meta" });
  return {
    name: t("appName"),
    short_name: t("appName"),
    description: t("description"),
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf8f4",
    theme_color: "#faf8f4",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
