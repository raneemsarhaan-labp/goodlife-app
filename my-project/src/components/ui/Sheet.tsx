import type { ReactNode } from "react";

/** A focused full-screen step (used for «ابدأ يومي» and «ختام اليوم») with a page heading. */
export function Sheet({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-5 pb-10 pt-8">
      <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
      <div className="flex flex-1 flex-col gap-5">{children}</div>
      {footer && <div className="flex flex-col gap-3">{footer}</div>}
    </main>
  );
}
