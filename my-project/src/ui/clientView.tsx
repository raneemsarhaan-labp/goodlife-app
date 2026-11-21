"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * A browser-only view built with Ionic (@ionic/react has no server rendering; research §3).
 * While its JavaScript loads, the server-rendered `Skeleton` holds the same layout.
 * Call at module level in a "use client" file.
 */
export function clientView<P extends object>(load: () => Promise<ComponentType<P>>, Skeleton: ComponentType) {
  return dynamic<P>(
    async () => {
      await import("./IonicRoot");
      return load();
    },
    { ssr: false, loading: () => <Skeleton /> },
  );
}
