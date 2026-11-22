"use client";

import { useEffect, useState } from "react";
import { displayName, readPrivateNames } from "@/lib/private-habits";

/**
 * A habit's name, with «عادة خاصّة» names read from this device (spec 007 US4). Renders the server's
 * name first (hydration-safe), then swaps in the device name after mount.
 */
export function HabitName({ id, name, isPrivate = false }: { id: string; name: string; isPrivate?: boolean }) {
  const [shown, setShown] = useState(name);
  useEffect(() => {
    if (!isPrivate) return;
    const id_ = window.setTimeout(() => setShown(displayName(id, name, true, readPrivateNames())), 0);
    return () => window.clearTimeout(id_);
  }, [id, name, isPrivate]);
  return <>{shown}</>;
}

/** Hook form of the same lookup, for components that need the string (labels, aria). */
export function usePrivateNames(): Record<string, string> {
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    const t = window.setTimeout(() => setNames(readPrivateNames()), 0);
    return () => window.clearTimeout(t);
  }, []);
  return names;
}
