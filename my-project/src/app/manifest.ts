import type { MetadataRoute } from "next";

/** Installable app manifest (FR-081, contracts/routes.md › PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "الحياة الطيبة",
    short_name: "الحياة الطيبة",
    description: "رفيقك في رحلة سنوية منظَّمة نحو حياة أكثر اتزانًا.",
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
