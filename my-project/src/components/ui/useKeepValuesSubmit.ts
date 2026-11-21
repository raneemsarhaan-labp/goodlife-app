"use client";

import { startTransition, type FormEvent } from "react";

/**
 * React 19 resets a form after a `<form action>` runs, even when the action returns an error.
 * This submit handler calls the action inside a transition instead, so typed values are kept
 * when validation fails. `prepare` can add fields (e.g. the device time zone) before sending.
 */
export function useKeepValuesSubmit(action: (formData: FormData) => void, prepare?: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    prepare?.(formData);
    startTransition(() => action(formData));
  };
}
