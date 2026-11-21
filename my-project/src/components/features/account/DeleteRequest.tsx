"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ActionForm } from "@/components/ui/ActionForm";
import { Button } from "@/components/ui/Button";
import { requestAccountDeletion } from "@/server/actions/account";

export function DeleteRequest({ requested }: { requested: boolean }) {
  const t = useTranslations("account");
  const [confirming, setConfirming] = useState(false);
  if (requested) return <p role="status" className="text-sage-700">{t("deleteRequested")}</p>;
  if (!confirming)
    return (
      <Button variant="quiet" className="self-start text-dawn-700" onClick={() => setConfirming(true)}>
        {t("delete")}
      </Button>
    );
  return (
    <ActionForm action={requestAccountDeletion} submitLabel={t("deleteConfirm")} renderSuccess={() => <p role="status" className="text-sage-700">{t("deleteRequested")}</p>}>
      <p className="text-sm text-dawn-700">{t("deleteHint")}</p>
    </ActionForm>
  );
}
