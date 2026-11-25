"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/ui/components/Icon";
import { icon } from "@/ui/icons";

type InstallPrompt = Event & { prompt: () => Promise<void> };
const DISMISS_KEY = "gl_install_dismissed";

/** Android: the native install prompt. iOS Safari: short instructions. Hidden when installed or dismissed. */
function useInstallPrompt() {
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

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setMode("hidden");
  };
  return { mode, promptEvent, dismiss };
}

/** The install card on «يومك». */
export function InstallHint() {
  const t = useTranslations("install");
  const { mode, promptEvent, dismiss } = useInstallPrompt();
  if (mode === "hidden") return null;
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

/** «تثبيت التطبيق على الشاشة» as a row of «المزيد» (the design's `.more-row`); same prompt and dismissal. */
export function InstallRow() {
  const t = useTranslations("install");
  const { mode, promptEvent, dismiss } = useInstallPrompt();
  if (mode === "hidden") return null;
  const body = (
    <>
      <span aria-hidden="true" className="sc-row-icon">
        <Icon src={icon("south")} className="sc-icon" />
      </span>
      <span className="sc-row-text">
        <span className="sc-row-name">{t("rowTitle")}</span>
        <span className="sc-row-sub">{mode === "android" ? t("rowSub") : t("ios")}</span>
      </span>
    </>
  );
  return (
    <li className="sc-row" style={{ padding: 0, display: "flex" }}>
      {mode === "android" && promptEvent ? (
        <button type="button" className="sc-row" style={{ border: 0, background: "none", boxShadow: "none", flex: 1 }} onClick={() => void promptEvent.prompt().then(dismiss)}>
          {body}
          <Icon src={icon("chevron_right")} className="sc-icon sc-row-chev" />
        </button>
      ) : (
        <div className="sc-row" style={{ border: 0, background: "none", boxShadow: "none", flex: 1 }}>
          {body}
        </div>
      )}
      <button type="button" className="sc-row-end" style={{ paddingInline: 12 }} onClick={dismiss}>
        {t("dismiss")}
      </button>
    </li>
  );
}
