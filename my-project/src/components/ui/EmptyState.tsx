import type { ReactNode } from "react";

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-sand-200 gl-surface p-6 text-center">
      <p className="text-lg font-medium text-ink-900">{title}</p>
      {body && <p className="text-ink-700">{body}</p>}
      {action}
    </div>
  );
}
