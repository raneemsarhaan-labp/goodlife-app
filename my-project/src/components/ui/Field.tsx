import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

type Common = { label: string; hint?: string; error?: string };

/** Labelled input with hint and error wired to aria-describedby (WCAG 2.1 AA). */
export function Field({ label, hint, error, className = "", ...props }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
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
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-11 rounded-xl gl-surface px-4 text-base text-ink-900 placeholder:text-ink-500 aria-invalid:border-dawn-700 ${className}`}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-dawn-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextArea({ label, hint, error, className = "", ...props }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
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
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-28 rounded-xl gl-surface px-4 py-3 text-base text-ink-900 placeholder:text-ink-500 aria-invalid:border-dawn-700 ${className}`}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-dawn-700">
          {error}
        </p>
      )}
    </div>
  );
}
