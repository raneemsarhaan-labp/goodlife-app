"use client";

import { useTranslations } from "next-intl";
import type { ErrorCode } from "@/server/actions/result";

/** Maps an action ErrorCode to its Arabic message. */
export function useErrorText() {
  const t = useTranslations("errors");
  return (code: ErrorCode | undefined) => (code ? t(code) : undefined);
}
