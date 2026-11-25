"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { ActionForm } from "@/components/ui/ActionForm";
import type { Result } from "@/server/actions/result";
import { icon } from "@/ui/icons";
import { Icon } from "@/ui/components/Icon";

type Action = (prev: Result<null> | null, formData: FormData) => Promise<Result<null> | null>;

/**
 * «وصف حالي المنشود» and «هويّتي» on «خطتي» as designed: the member's words in their card, with an
 * edit control that opens the same text in place. Opens by itself when empty, or when the page is
 * opened at its anchor (e.g. «يومك» › «تعديل «حالي المنشود»» → /plan#desired-state).
 */
export function PlanTextCard({
  variant,
  id,
  label,
  fieldLabel,
  hint,
  placeholder,
  emptyText,
  editLabel,
  saveLabel,
  savedText,
  name,
  value,
  maxLength,
  action,
  tools,
}: {
  variant: "intent" | "identity";
  id: string;
  label: string;
  fieldLabel: string;
  hint: string;
  placeholder: string;
  emptyText: string;
  editLabel: string;
  saveLabel: string;
  savedText: string;
  name: string;
  value: string;
  maxLength: number;
  action: Action;
  tools?: ReactNode;
}) {
  const uid = useId();
  const text = value.trim();
  const [open, setOpen] = useState(!text);
  useEffect(() => {
    if (window.location.hash !== `#${id}`) return;
    const t = window.setTimeout(() => setOpen(true), 0);
    return () => window.clearTimeout(t);
  }, [id]);

  const editor = open && (
    <div id={`${uid}-editor`}>
      <ActionForm action={action} submitLabel={saveLabel} successText={savedText} className="pn-editor pn-form">
        <label htmlFor={`${uid}-field`} className="sr-only">
          {fieldLabel}
        </label>
        <textarea
          id={`${uid}-field`}
          name={name}
          defaultValue={value}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-describedby={`${uid}-hint`}
        />
        <p id={`${uid}-hint`} className="pn-hint">
          {hint}
        </p>
      </ActionForm>
    </div>
  );
  const toggle = (className: string, src: string) => (
    <button type="button" className={`${className} td-hit`} aria-expanded={open} aria-controls={`${uid}-editor`} aria-label={editLabel} onClick={() => setOpen((o) => !o)}>
      <Icon src={src} />
    </button>
  );

  if (variant === "identity") {
    return (
      <section id={id} aria-labelledby={`${uid}-title`} className={`pn-card pn-identity scroll-mt-6 ${open ? "is-open" : ""}`}>
        <div className="pn-identity-row">
          <div className="pn-identity-text">
            <h2 id={`${uid}-title`} className="pn-label">
              {label}
            </h2>
            {!open && <p>{text || emptyText}</p>}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative 56px illustration */}
          <img src="/design/identity.webp" alt="" width={56} height={56} className="pn-identity-photo" />
          {toggle("pn-chev", icon("chevron_left"))}
        </div>
        {editor}
      </section>
    );
  }

  return (
    <section id={id} aria-labelledby={`${uid}-title`} className="pn-card pn-intent scroll-mt-6">
      <div className="pn-card-head">
        <h2 id={`${uid}-title`} className="pn-label">
          {label}
        </h2>
        <div className="pn-card-tools">
          {tools}
          {toggle("pn-round", icon("edit"))}
        </div>
      </div>
      {!open && (text ? <p className="pn-intent-text">{text}</p> : <p className="pn-empty-text">{emptyText}</p>)}
      {editor}
    </section>
  );
}
