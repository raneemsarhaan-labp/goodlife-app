"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/ui/components/Icon";
import { flowIcon } from "@/ui/icons-flow";
import { FieldLabel } from "./FieldLabel";

/**
 * «الخصوصيّة» (spec 007 FR-001, FR-006): share with the group (peers see name and today's state), or a
 * private habit whose name stays on this device. The two exclude each other. Drawn as the designed
 * tinted rows with a switch.
 */
export function SharingSwitches({
  shared,
  isPrivate,
  onChange,
  privateLocked = false,
}: {
  shared: boolean;
  isPrivate: boolean;
  onChange: (next: { shared: boolean; isPrivate: boolean }) => void;
  privateLocked?: boolean;
}) {
  const t = useTranslations("privateHabit");
  return (
    <fieldset className="mt-0.5">
      <FieldLabel as="legend" text={t("privacyTitle")} plain />
      <label className="toggle-row is-share">
        <span className="tr-icon" aria-hidden="true">
          <Icon src={flowIcon("group")} />
        </span>
        <span className="tr-text">
          <span id="share-title" className="tr-title">{t("shareLabel")}</span>
          <span id="share-hint" className="tr-hint">
            {t("shareHint")}
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          name="shared"
          checked={shared}
          disabled={isPrivate}
          onChange={(e) => onChange({ shared: e.target.checked, isPrivate: false })}
          aria-labelledby="share-title"
          aria-describedby="share-hint"
          className="switch"
        />
      </label>
      <label className="toggle-row is-private">
        <span className="tr-icon" aria-hidden="true">
          <Icon src={flowIcon("lock")} />
        </span>
        <span className="tr-text">
          <span id="private-title" className="tr-title">{t("privateLabel")}</span>
          <span id="private-hint" className="tr-hint">
            {t("privateHint")}
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          name="isPrivate"
          checked={isPrivate}
          disabled={privateLocked}
          onChange={(e) => onChange({ shared: false, isPrivate: e.target.checked })}
          aria-labelledby="private-title"
          aria-describedby="private-hint"
          className="switch"
        />
      </label>
    </fieldset>
  );
}
