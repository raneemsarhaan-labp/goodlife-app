"use client";

import { useTranslations } from "next-intl";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { createInvitations } from "@/server/actions/admin/invitations";
import { CopyButton } from "./CopyButton";

export function InvitationForm({ groups }: { groups: { id: string; label: string }[] }) {
  const t = useTranslations("admin.invitations");
  return (
    <ActionForm
      action={createInvitations}
      submitLabel={t("generate")}
      renderSuccess={({ codes }) => (
        <div role="status" className="flex flex-col gap-2 rounded-2xl bg-sage-50 p-4">
          <p className="font-medium">{t("generated")}</p>
          <p dir="ltr" className="font-mono tracking-widest">{codes.join("  ")}</p>
          <CopyButton text={codes.join("\n")} />
        </div>
      )}
    >
      <Select name="groupId" label={t("group")} required>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>{g.label}</option>
        ))}
      </Select>
      <Field name="count" type="number" min={1} max={50} defaultValue={1} label={t("count")} required />
      <Field name="maxUses" type="number" min={1} max={500} defaultValue={1} label={t("maxUses")} required />
      <Field name="expiresInDays" type="number" min={1} max={365} defaultValue={30} label={t("expiresInDays")} required />
    </ActionForm>
  );
}
