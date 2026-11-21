"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { requestDataExport } from "@/server/actions/account";

export function ExportButton() {
  const t = useTranslations("account");
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      disabled={pending}
      className="self-start"
      onClick={() =>
        start(async () => {
          const result = await requestDataExport();
          if (!result.ok) return;
          const url = URL.createObjectURL(new Blob([result.data.json], { type: "application/json" }));
          const a = Object.assign(document.createElement("a"), { href: url, download: "goodlife-my-data.json" });
          a.click();
          URL.revokeObjectURL(url);
        })
      }
    >
      {t("export")}
    </Button>
  );
}
