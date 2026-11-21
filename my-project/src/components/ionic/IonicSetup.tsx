"use client";

import { setupIonicReact } from "@ionic/react";

/**
 * Initializes Ionic (research.md §11) once on the client. iOS mode everywhere for one calm look;
 * direction comes from <html dir="rtl">. Ionic components must be used in client components.
 */
setupIonicReact({ mode: "ios" });

export function IonicSetup() {
  return null;
}
