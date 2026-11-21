"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CopyButton({ text }: { text: string }) {
  const t = useTranslations("admin.invitations");
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="quiet"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }}
    >
      <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
    </Button>
  );
}
