import { z } from "zod";
import { emptyToUndefined, uuidSchema } from "./common";

export const RESOURCE_TYPES = ["recording", "file", "reference"] as const;

// data-model.md resources.type, resources.title, resources.url, resources.storage_path, resources.audience
// (plus resources.description and resources.category; audiences: resource_audiences.cohort_id / group_id)
export const resourceSchema = z
  .object({
    id: z.preprocess(emptyToUndefined, uuidSchema.optional()),
    type: z.enum(RESOURCE_TYPES),
    title: z.string().trim().min(2).max(160),
    description: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()),
    category: z.preprocess(emptyToUndefined, z.string().trim().max(60).optional()),
    storagePath: z.preprocess(emptyToUndefined, z.string().regex(/^[A-Za-z0-9/_.-]+$/).optional()),
    url: z.preprocess(emptyToUndefined, z.url({ protocol: /^https?$/ }).optional()),
    audience: z.enum(["program", "cohorts", "groups"]),
    cohortIds: z.array(uuidSchema).default([]),
    groupIds: z.array(uuidSchema).default([]),
  })
  .refine((r) => Boolean(r.storagePath || r.url) || Boolean(r.id), { path: ["url"] })
  .refine((r) => r.audience !== "cohorts" || r.cohortIds.length > 0, { path: ["audience"] })
  .refine((r) => r.audience !== "groups" || r.groupIds.length > 0, { path: ["audience"] });

// data-model.md journey_stages.from_day, journey_stages.to_day (plus title/description)
export const journeyStageSchema = z
  .object({
    id: z.preprocess(emptyToUndefined, uuidSchema.optional()),
    title: z.string().trim().min(2).max(80),
    description: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()),
    fromDay: z.coerce.number().int().min(1).max(365),
    toDay: z.coerce.number().int().min(1).max(365),
  })
  .refine((s) => s.toDay >= s.fromDay, { path: ["toDay"] });

// data-model.md guidelines.number, guidelines.text
export const guidelineSchema = z.object({
  number: z.coerce.number().int().min(1).max(10),
  text: z.string().trim().min(2).max(1000),
});

/** Storage object name for an upload: "<yyyy>/<uuid>.<ext>" (safe characters only). */
export function storagePathFor(fileName: string, id: string, now = new Date()): string {
  const ext = (fileName.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
  return `${now.getUTCFullYear()}/${id}.${ext}`;
}
