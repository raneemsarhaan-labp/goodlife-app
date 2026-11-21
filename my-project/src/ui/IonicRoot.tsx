"use client";

import { setupIonicReact } from "@ionic/react";

/**
 * Ionic setup, imported only by client views (never the root layout), so pages without Ionic
 * views do not load Ionic's JavaScript (spec 002 research §4). iOS mode for one calm look.
 */
setupIonicReact({ mode: "ios" });

export const IONIC_READY = true;
