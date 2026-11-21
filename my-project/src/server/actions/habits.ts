"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { habitSchema } from "@/lib/validation/today";
import { fail, fromDbError, type Result } from "./result";

/** Adds a habit to the member's current plan (end of the list). */
export async function createHabit(_prev: Result<null> | null, formData: FormData): Promise<Result<null> | null> {
  const parsed = habitSchema.safeParse({ name: formData.get("name"), description: formData.get("description") ?? "" });
  if (!parsed.success) return fail("invalid_input", String(parsed.error.issues[0]?.path[0] ?? "name"));
  const supabase = await createClient();
  const { data: planId, error: planError } = await supabase.rpc("current_plan_id");
  if (planError || !planId) return fail("forbidden");
  const { data: last } = await supabase
    .from("habits")
    .select("sort_order")
    .eq("plan_id", planId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("habits").insert({
    plan_id: planId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) return fromDbError(error);
  redirect("/");
}
