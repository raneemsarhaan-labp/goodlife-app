"use client";

import { clientView } from "@/ui/clientView";
import { TodayIslandSkeleton } from "@/ui/views/TodayIslandSkeleton";

/** @ionic/react does not support server rendering: Ionic views load in the browser only. */
export const IonicShowcaseClientOnly = clientView(() => import("./IonicShowcase").then((m) => m.IonicShowcase), TodayIslandSkeleton);
