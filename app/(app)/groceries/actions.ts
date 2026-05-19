"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActivePlan } from "@/lib/plan";

export async function setGroceryCheck(
  itemId: string,
  checked: boolean,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  // Derive household + week server-side; never trust the client for these.
  const plan = await getActivePlan(supabase);
  if (!plan) return { ok: false };

  const { error } = await supabase.from("grocery_checks").upsert(
    {
      household_id: plan.household_id,
      grocery_item_id: itemId,
      week_starting: plan.week_started_on,
      checked,
      checked_by: user.id,
    },
    { onConflict: "household_id,grocery_item_id,week_starting" },
  );

  if (error) {
    console.error("setGroceryCheck:", error.message);
    return { ok: false };
  }

  revalidatePath("/groceries");
  return { ok: true };
}

export async function resetGroceries(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const plan = await getActivePlan(supabase);
  if (!plan) return { ok: false };

  const { error } = await supabase
    .from("grocery_checks")
    .delete()
    .eq("household_id", plan.household_id)
    .eq("week_starting", plan.week_started_on);

  if (error) {
    console.error("resetGroceries:", error.message);
    return { ok: false };
  }

  revalidatePath("/groceries");
  return { ok: true };
}
