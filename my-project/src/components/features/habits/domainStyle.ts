import type { DomainColor } from "@/server/queries/domains";

/**
 * Colour family → surface classes for domain cards and chips. Text stays ink-900 on every tint
 * (≥ 7:1); the tint carries the colour, so no colour is relied on alone (WCAG 1.4.1, 1.4.3).
 */
export const DOMAIN_TINT: Record<DomainColor, string> = {
  sage: "bg-sage-100",
  dawn: "bg-dawn-50",
  gold: "bg-gold-100",
  ink: "bg-sand-100",
  violet: "bg-[oklch(93%_0.025_290)]",
};
