"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { Result } from "@/server/actions/result";

/**
 * Reorder with up/down buttons (keyboard and screen-reader friendly; not drag-only).
 * Saves the new order through `onReorder` and announces it politely.
 */
export function ReorderList({
  items,
  onReorder,
  label,
}: {
  items: { id: string; label: string }[];
  onReorder: (ids: string[]) => Promise<Result<null>>;
  label: string;
}) {
  const t = useTranslations("reorder");
  const te = useTranslations("errors");
  const [order, setOrder] = useState(items);
  const [status, setStatus] = useState("");
  const [, startTransition] = useTransition();

  function move(index: number, delta: -1 | 1) {
    const next = [...order];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item!);
    setOrder(next);
    startTransition(async () => {
      const result = await onReorder(next.map((i) => i.id));
      setStatus(result.ok ? t("saved") : te(result.error));
    });
  }

  return (
    <div>
      <ol aria-label={label} className="flex flex-col gap-2">
        {order.map((item, i) => (
          <li key={item.id} className="flex items-center gap-2 rounded-xl gl-surface px-3 py-1">
            <span className="flex-1">{item.label}</span>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full text-sage-700 hover:bg-sage-50 disabled:opacity-30"
              disabled={i === 0}
              aria-label={t("moveUp", { label: item.label })}
              onClick={() => move(i, -1)}
            >
              ▲
            </button>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full text-sage-700 hover:bg-sage-50 disabled:opacity-30"
              disabled={i === order.length - 1}
              aria-label={t("moveDown", { label: item.label })}
              onClick={() => move(i, 1)}
            >
              ▼
            </button>
          </li>
        ))}
      </ol>
      <p role="status" className="mt-2 text-sm text-sage-700">
        {status}
      </p>
    </div>
  );
}
