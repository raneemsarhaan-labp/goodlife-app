"use client";

import { IonCard, IonCardContent, IonCardHeader, IonCardTitle } from "@ionic/react";
import type { ReactNode } from "react";

/** IonCard on the version's surface tokens (contracts/ui-themes.md › GlassCard). */
export function GlassCard({ title, titleId, actions, children, className = "" }: { title?: string; titleId?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <IonCard className={`gl-surface m-0 rounded-[var(--radius-card)] shadow-none ${className}`} aria-labelledby={titleId}>
      {title && (
        <IonCardHeader className="flex flex-row items-center justify-between pb-1">
          <IonCardTitle id={titleId} className="text-lg font-semibold text-ink-900">
            {title}
          </IonCardTitle>
          {actions}
        </IonCardHeader>
      )}
      <IonCardContent className="text-ink-900">{children}</IonCardContent>
    </IonCard>
  );
}
