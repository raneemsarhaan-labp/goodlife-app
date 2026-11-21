import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { IonicSetup } from "@/components/ionic/IonicSetup";
import { LOCALE } from "@/i18n/request";
// Ionic component base styles first, so the app's own styles (globals.css) win.
import "@ionic/react/css/core.css";
import "./globals.css";

// Self-hosted IBM Plex Sans Arabic (SIL OFL 1.1, see fonts/OFL-LICENSE.txt).
const plexArabic = localFont({
  src: [
    { path: "./fonts/plex-arabic-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/plex-arabic-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/plex-arabic-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-arabic",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: LOCALE, namespace: "meta" });
  return {
    title: { default: t("appName"), template: t("titleTemplate") },
    description: t("description"),
    applicationName: t("appName"),
    appleWebApp: { capable: true, title: t("appName"), statusBarStyle: "default" },
    icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  };
}

export const viewport: Viewport = {
  themeColor: "#faf8f4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("common");
  return (
    <html lang="ar" dir="rtl" className={plexArabic.variable}>
      <body className="min-h-dvh bg-sand-50 text-ink-900 antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
        >
          {t("skipToContent")}
        </a>
        <IonicSetup />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
