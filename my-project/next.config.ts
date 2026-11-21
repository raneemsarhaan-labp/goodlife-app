import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  cacheOnNavigation: true,
  reloadOnOnline: false,
});

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default withSerwist(withNextIntl(nextConfig));
