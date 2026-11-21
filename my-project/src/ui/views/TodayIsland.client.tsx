"use client";

import { clientView } from "@/ui/clientView";
import type { TodayIslandProps } from "./TodayIsland";
import { TodayIslandSkeleton } from "./TodayIslandSkeleton";

export const TodayIslandClient = clientView<TodayIslandProps>(() => import("./TodayIsland").then((m) => m.TodayIsland), TodayIslandSkeleton);
