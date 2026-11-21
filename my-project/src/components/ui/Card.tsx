import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border border-sand-200 bg-white p-5 shadow-sm ${className}`}
      {...props}
    />
  );
}

export function CardTitle({ className = "", ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-lg font-semibold text-ink-900 ${className}`} {...props} />;
}
