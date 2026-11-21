"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { getResourceUrl } from "@/server/actions/resources";

const VIDEO = /\.(mp4|webm|mov|m4v)(\?|$)/i;

/**
 * Fetches a short-lived signed link only when the member asks for it (FR-051), then plays
 * recordings in an accessible native player or starts the download / opens the link.
 */
export function OpenResource({ id, type, title }: { id: string; type: "recording" | "file" | "reference"; title: string }) {
  const t = useTranslations("resources");
  const te = useTranslations("errors");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function open() {
    start(async () => {
      const result = await getResourceUrl(id);
      if (!result.ok) return setError(te(result.error));
      if (type === "recording") setUrl(result.data.url);
      else window.open(result.data.url, "_blank", "noopener,noreferrer");
    });
  }

  if (url) {
    return VIDEO.test(url) ? (
      <video controls src={url} className="w-full rounded-xl" aria-label={title} />
    ) : (
      <audio controls src={url} className="w-full" aria-label={title} />
    );
  }
  const label = type === "recording" ? t("listen") : type === "file" ? t("download") : t("openLink");
  return (
    <div className="flex flex-col gap-1">
      <Button variant="secondary" onClick={open} disabled={pending} className="self-start" aria-label={`${label}: ${title}`}>
        {pending ? t("loading") : label}
      </Button>
      {error && <p role="alert" className="text-sm text-dawn-700">{error}</p>}
    </div>
  );
}
