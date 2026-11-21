"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/common";
import { orderSchema } from "@/lib/validation/plan";
import { guidelineSchema, journeyStageSchema, resourceSchema, storagePathFor } from "@/lib/validation/resources";
import { fail, fromDbError, ok, type Result } from "../result";
import { currentAdmin, firstIssuePath, formObject } from "./guard";

type State = Result<null> | null;

function refresh() {
  revalidatePath("/admin/resources");
  revalidatePath("/resources", "layout");
}

/**
 * Step 1 of an upload: a signed upload URL so the browser sends the file straight to storage
 * (no size limit from Server Actions). Storage RLS allows inserts for admins only.
 */
export async function prepareResourceUpload(fileName: string): Promise<Result<{ path: string; token: string }>> {
  if (!(await currentAdmin())) return fail("forbidden");
  const path = storagePathFor(fileName, crypto.randomUUID());
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("resources").createSignedUploadUrl(path);
  if (error || !data) return fail("forbidden");
  return ok({ path, token: data.token });
}

/** Step 2: save the resource's details and audience (after any upload). */
export async function saveResource(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = resourceSchema.safeParse(formObject(formData, ["cohortIds", "groupIds"]));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const r = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_resource", {
    p_id: r.id,
    p_type: r.type,
    p_title: r.title,
    p_description: r.description ?? "",
    p_category: r.category ?? "",
    p_storage_path: r.storagePath ?? "",
    p_url: r.url ?? "",
    p_audience: r.audience,
    p_cohort_ids: r.audience === "cohorts" ? r.cohortIds : undefined,
    p_group_ids: r.audience === "groups" ? r.groupIds : undefined,
  });
  if (error) return fromDbError(error);
  refresh();
  return ok(null);
}

export async function deleteResource(formData: FormData): Promise<void> {
  if (!(await currentAdmin())) return;
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  const { data } = await supabase.from("resources").delete().eq("id", id.data).select("storage_path").maybeSingle();
  if (data?.storage_path) await supabase.storage.from("resources").remove([data.storage_path]);
  refresh();
}

export async function reorderResources(ids: string[]): Promise<Result<null>> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = orderSchema.safeParse(ids);
  if (!parsed.success) return fail("invalid_input");
  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_resources", { p_ids: parsed.data });
  if (error) return fromDbError(error);
  refresh();
  return ok(null);
}

export async function upsertJourneyStage(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = journeyStageSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const s = parsed.data;
  const supabase = await createClient();
  const row = { title: s.title, description: s.description ?? null, from_day: s.fromDay, to_day: s.toDay, sort_order: s.fromDay };
  const { error } = s.id ? await supabase.from("journey_stages").update(row).eq("id", s.id) : await supabase.from("journey_stages").insert(row);
  if (error) return error.code === "23P01" ? fail("conflict", "fromDay") : fromDbError(error);
  revalidatePath("/admin/content");
  revalidatePath("/resources/map");
  return ok(null);
}

export async function deleteJourneyStage(formData: FormData): Promise<void> {
  if (!(await currentAdmin())) return;
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("journey_stages").delete().eq("id", id.data);
  revalidatePath("/admin/content");
  revalidatePath("/resources/map");
}

export async function upsertGuideline(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = guidelineSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const supabase = await createClient();
  const { error } = await supabase.from("guidelines").upsert({ number: parsed.data.number, text: parsed.data.text }, { onConflict: "number" });
  if (error) return fromDbError(error);
  revalidatePath("/admin/content");
  revalidatePath("/resources/guidelines");
  return ok(null);
}
