import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getActivePlan } from "@/lib/plan";

type DB = SupabaseClient<Database>;

export const CATEGORY_ORDER = [
  "protein",
  "produce",
  "pantry",
  "dairy",
] as const;
export type Category = (typeof CATEGORY_ORDER)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  protein: "Protein",
  produce: "Produce",
  pantry: "Pantry",
  dairy: "Dairy",
};

export interface GroceryRow {
  id: string;
  name: string;
  quantity: string | null;
  category: Category;
  checked: boolean;
}

export interface GroceryData {
  householdId: string;
  weekStarting: string;
  week: number;
  rows: GroceryRow[];
}

export async function getGroceries(
  supabase: DB,
): Promise<GroceryData | null> {
  const plan = await getActivePlan(supabase);
  if (!plan) return null;

  const { data: items, error } = await supabase
    .from("grocery_items")
    .select("id, name, quantity, category")
    .eq("plan_id", plan.id)
    .eq("week", plan.current_week)
    .order("category", { ascending: true })
    .order("display_order", { ascending: true });
  if (error) console.error("getGroceries items:", error.message);

  const { data: checks, error: cErr } = await supabase
    .from("grocery_checks")
    .select("grocery_item_id, checked")
    .eq("household_id", plan.household_id)
    .eq("week_starting", plan.week_started_on);
  if (cErr) console.error("getGroceries checks:", cErr.message);

  const checkedSet = new Set(
    (checks ?? []).filter((c) => c.checked).map((c) => c.grocery_item_id),
  );

  const rows: GroceryRow[] = (items ?? []).map((it) => ({
    id: it.id,
    name: it.name,
    quantity: it.quantity,
    category: it.category as Category,
    checked: checkedSet.has(it.id),
  }));

  return {
    householdId: plan.household_id,
    weekStarting: plan.week_started_on,
    week: plan.current_week,
    rows,
  };
}
