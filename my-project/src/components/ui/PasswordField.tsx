"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { useTranslations } from "next-intl";
import { icon } from "@/ui/icons";

type Props = { label: string; hint?: string; error?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/** Password input with a show/hide button (WCAG: toggle is a real button with a pressed state). */
export function PasswordField({ label, hint, error, className = "", ...props }: Props) {
  const id = useId();
  const t = useTranslations("common");
  const [shown, setShown] = useState(false);
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const mask = `url("${icon(shown ? "visibility_off" : "visibility")}")`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium text-ink-900">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-ink-500">
          {hint}
        </p>
      )}
      <div dir="ltr" className="relative">
        <input
          id={id}
          type={shown ? "text" : "password"}
          dir="ltr"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`min-h-11 w-full rounded-xl gl-surface py-2 pe-4 ps-12 text-base text-ink-900 aria-invalid:border-dawn-700 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          aria-label={t("showPassword")}
          className="absolute inset-y-0 start-0 flex w-11 items-center justify-center rounded-xl text-ink-700"
        >
          <span aria-hidden="true" className="size-6 bg-current" style={{ maskImage: mask, WebkitMaskImage: mask, maskSize: "contain", WebkitMaskSize: "contain" }} />
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-dawn-700">
          {error}
        </p>
      )}
    </div>
  );
}
