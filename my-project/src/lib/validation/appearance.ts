import { z } from "zod";

// data-model.md users.ui_version (DOM ids; converted with toDb), users.ui_ritual, users.ui_reduce_transparency
export const appearanceSchema = z.object({
  version: z.enum(["journey", "glass", "full-glass"]),
  ritual: z.preprocess((v) => v === undefined ? undefined : v === "on" || v === "true" || v === true, z.boolean().optional()),
  reduceTransparency: z.preprocess((v) => v === undefined ? undefined : v === "on" || v === "true" || v === true, z.boolean().optional()),
});
