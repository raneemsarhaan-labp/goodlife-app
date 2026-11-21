"use server";

import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/common";
import { fail, ok, type Result } from "./result";

const SIGNED_URL_SECONDS = 600;

/**
 * A link to open a resource (FR-051). The resource must be visible to the caller under RLS;
 * stored files get a 10-minute signed URL (storage RLS re-checks the audience). Anything else
 * is `not_found`, so existence is not revealed.
 */
export async function getResourceUrl(resourceId: string): Promise<Result<{ url: string; expiresAt: string | null }>> {
  const id = uuidSchema.safeParse(resourceId);
  if (!id.success) return fail("not_found");
  const supabase = await createClient();
  const { data: resource } = await supabase.from("resources").select("storage_path, url").eq("id", id.data).maybeSingle();
  if (!resource) return fail("not_found");
  if (!resource.storage_path) return resource.url ? ok({ url: resource.url, expiresAt: null }) : fail("not_found");
  const { data, error } = await supabase.storage.from("resources").createSignedUrl(resource.storage_path, SIGNED_URL_SECONDS);
  if (error || !data) return fail("not_found");
  return ok({ url: data.signedUrl, expiresAt: new Date(Date.now() + SIGNED_URL_SECONDS * 1000).toISOString() });
}
