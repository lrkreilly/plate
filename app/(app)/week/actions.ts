"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setCurrentWeek(week: 1 | 2): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("plans")
    .update({ current_week: week })
    .eq("active", true);

  if (error) {
    console.error("setCurrentWeek:", error.message);
    return { ok: false };
  }

  revalidatePath("/week");
  revalidatePath("/");
  revalidatePath("/groceries");
  return { ok: true };
}
