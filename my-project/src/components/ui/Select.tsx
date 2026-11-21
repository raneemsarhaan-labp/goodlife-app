import { useId, type SelectHTMLAttributes } from "react";

export function Select({ label, className = "", children, ...props }: { label: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <select id={id} className={`min-h-11 rounded-xl gl-surface px-3 ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}
