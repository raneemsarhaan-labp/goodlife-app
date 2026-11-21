"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type InstallPrompt = Event & { prompt: () => Promise<void> };
const DISMISS_KEY = "gl_install_dismissed";

/** Android: native install prompt. iOS Safari: short instructions. Hidden when already installed. */
export function InstallHint() {
  const t = useTranslations("install");
  const [mode, setMode] = useState<"hidden" | "android" | "ios">("hidden");
  const [promptEvent, setPromptEvent] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {}
    if (standalone || dismissed) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as InstallPrompt);
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const timer = isIos ? window.setTimeout(() => setMode("ios"), 0) : undefined;
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (mode === "hidden") return null;
  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setMode("hidden");
  };
  return (
    <section aria-labelledby="install-hint" className="flex flex-col gap-2 rounded-[var(--radius-card)] gl-surface p-4">
      <h2 id="install-hint" className="font-semibold">{t("title")}</h2>
      <p className="text-sm text-ink-700">{mode === "android" ? t("android") : t("ios")}</p>
      <div className="flex gap-2">
        {mode === "android" && promptEvent && (
          <Button onClick={() => void promptEvent.prompt().then(dismiss)}>{t("install")}</Button>
        )}
        <Button variant="quiet" onClick={dismiss}>{t("dismiss")}</Button>
      </div>
    </section>
  );
}
