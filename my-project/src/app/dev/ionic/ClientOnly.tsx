"use client";

import dynamic from "next/dynamic";

/** @ionic/react does not support server rendering: Ionic views load in the browser only. */
export const IonicShowcaseClientOnly = dynamic(() => import("./IonicShowcase").then((m) => m.IonicShowcase), { ssr: false });
