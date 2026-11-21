/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // «يومك» opens offline: network first, cached copy when there is no connection (research §4).
    {
      matcher: ({ request, url }) => request.mode === "navigate" && url.pathname === "/",
      handler: new NetworkFirst({ cacheName: "today-page", networkTimeoutSeconds: 3 }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
