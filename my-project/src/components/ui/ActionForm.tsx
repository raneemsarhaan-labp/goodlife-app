"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, type ReactNode } from "react";
import type { Result } from "@/server/actions/result";
import { Button } from "./Button";
import { useKeepValuesSubmit } from "./useKeepValuesSubmit";

type Action<T> = (prev: Result<T> | null, formData: FormData) => Promise<Result<T> | null>;

/**
 * A form bound to a Server Action that returns Result. Keeps typed values on error, shows the
 * Arabic error (role=alert) or a calm success note (role=status), optionally resets on success.
 */
export function ActionForm<T>({
  action,
  submitLabel,
  children,
  className = "flex flex-col gap-4",
  resetOnSuccess = false,
  successText,
  fieldErrors = {},
  renderSuccess,
}: {
  action: Action<T>;
  submitLabel: string;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  successText?: string;
  fieldErrors?: Partial<Record<string, string>>;
  renderSuccess?: (data: T) => ReactNode;
}) {
  const te = useTranslations("errors");
  const [state, dispatch, pending] = useActionState(action, null);
  const onSubmit = useKeepValuesSubmit(dispatch);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  const error =
    state && !state.ok ? (state.field && fieldErrors[`${state.field}:${state.error}`]) || te(state.error) : null;

  return (
    <form ref={ref} onSubmit={onSubmit} className={className}>
      {children}
      {error && (
        <p role="alert" className="text-sm text-dawn-700">
          {error}
        </p>
      )}
      {state?.ok && (renderSuccess?.(state.data) ?? (successText && <p role="status" className="text-sm text-sage-700">{successText}</p>))}
      <Button type="submit" disabled={pending} className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
