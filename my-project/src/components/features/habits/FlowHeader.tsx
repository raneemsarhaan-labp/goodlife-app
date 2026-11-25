import type { ReactNode, Ref } from "react";

/**
 * The designed header of the full-screen flows (new habit, edit habit, plan review): title and
 * subtitle, the round back/close control at the other end, and the segmented progress bar.
 */
export function FlowHeader({
  title,
  sub,
  close,
  segments,
  on,
  headingRef,
  tall = false,
  children,
}: {
  title: string;
  sub?: string;
  close: ReactNode;
  segments: number;
  /** Which segments are filled. */
  on: (index: number) => boolean;
  headingRef?: Ref<HTMLHeadingElement>;
  /** The habit flow's taller header (the design's fixed 119px). */
  tall?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className={`af-header ${tall ? "is-tall" : ""}`}>
      <div className="af-top">
        <div>
          <h1 ref={headingRef} tabIndex={-1} className="af-title">
            {title}
          </h1>
          {sub && <p className="af-sub">{sub}</p>}
          {children}
        </div>
        {close}
      </div>
      <div className="af-progress" aria-hidden="true">
        {Array.from({ length: segments }, (_, i) => (
          <i key={i} className={on(i) ? "is-on" : undefined} />
        ))}
      </div>
    </header>
  );
}
