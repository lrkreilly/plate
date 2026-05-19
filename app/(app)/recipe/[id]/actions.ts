"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { nzDateString } from "@/lib/time";

export type LogMealResult = { ok: true } | { ok: false; error: string };

export async function logMeal(
  slotId: string,
  rating: number,
  kidsVerdict: string,
  notes: string,
): Promise<LogMealResult> {
  if (!slotId) return { ok: false, error: "No meal slot for today." };
  if (rating < 1 || rating > 5) return { ok: false, error: "Pick a rating." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const date = nzDateString();
  const payload = {
    user_id: user.id,
    meal_slot_id: slotId,
    date,
    rating,
    kids_verdict: kidsVerdict.trim() || null,
    notes: notes.trim() || null,
  };

  // One log per user per slot per day — update if it already exists.
  const { data: existing } = await supabase
    .from("meal_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("meal_slot_id", slotId)
    .eq("date", date)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("meal_logs").update(payload).eq("id", existing.id)
    : await supabase.from("meal_logs").insert(payload);

  if (error) return { ok: false, error: "Could not save. Try again." };

  revalidatePath("/");
  revalidatePath(`/recipe`);
  return { ok: true };
}
