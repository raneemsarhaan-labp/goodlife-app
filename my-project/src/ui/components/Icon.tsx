import type { CSSProperties } from "react";

/**
 * A Material Symbols icon drawn in the current text colour (CSS mask over a data URL from
 * `@/ui/icons`). Decorative: the control around it carries the accessible name.
 */
export function Icon({ src, className = "", style }: { src: string; className?: string; style?: CSSProperties }) {
  const mask = `url("${src}")`;
  return <span aria-hidden="true" className={`gl-icon ${className}`} style={{ maskImage: mask, WebkitMaskImage: mask, ...style }} />;
}
