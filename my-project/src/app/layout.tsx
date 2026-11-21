import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { getAppearance } from "@/server/appearance";
import { LOCALE } from "@/i18n/request";
// Ionic component base styles first, so the app's own styles (globals.css) win.
import "@ionic/react/css/core.css";
import "./globals.css";


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
  const [t, appearance] = await Promise.all([getTranslations("common"), getAppearance()]);
  return (
    // suppressHydrationWarning: Ionic adds its mode/platform classes to <html> in the browser.
    <html
      lang="ar"
      dir="rtl"
      data-ui={appearance.version}
      data-reduce-transparency={appearance.reduceTransparency ? "true" : undefined}
      data-save-data={appearance.saveData ? "true" : undefined}
      suppressHydrationWarning
    >
      <head>
        <link rel="preload" href="/fonts/cairo-arabic-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-dvh text-ink-900 antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
