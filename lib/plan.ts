import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { effectiveWeekday, nzNow } from "@/lib/time";

type DB = SupabaseClient<Database>;

export type Recipe = Database["public"]["Tables"]["recipes"]["Row"];
export type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type MealType = "breakfast" | "lunch" | "dinner";

export interface RecipeStep {
  title: string;
  content: string;
  timer_seconds?: number;
}

export interface SlotWithRecipe {
  id: string;
  meal_type: MealType;
  recipe: Recipe;
}

export interface TodayMeals {
  plan: Plan;
  dayOfWeek: number;
  isWeekend: boolean;
  breakfast: SlotWithRecipe | null;
  lunch: SlotWithRecipe | null;
  dinner: SlotWithRecipe | null;
}

export function recipeSteps(recipe: Recipe): RecipeStep[] {
  return Array.isArray(recipe.steps)
    ? (recipe.steps as unknown as RecipeStep[])
    : [];
}

export function recipeIngredients(recipe: Recipe): string[] {
  return Array.isArray(recipe.ingredients)
    ? (recipe.ingredients as string[])
    : [];
}

export async function getActivePlan(supabase: DB): Promise<Plan | null> {
  // RLS restricts this to the signed-in user's household plan.
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) console.error("getActivePlan:", error.message);
  return data ?? null;
}

export async function getTodayMeals(
  supabase: DB,
): Promise<TodayMeals | null> {
  const plan = await getActivePlan(supabase);
  if (!plan) return null;

  const { dayOfWeek, isWeekend } = effectiveWeekday(nzNow());

  const { data: slots, error } = await supabase
    .from("meal_slots")
    .select("id, meal_type, recipe:recipes(*)")
    .eq("plan_id", plan.id)
    .eq("week", plan.current_week)
    .eq("day_of_week", dayOfWeek);
  if (error) console.error("getTodayMeals:", error.message);

  const byType = (t: MealType): SlotWithRecipe | null => {
    const row = slots?.find((s) => s.meal_type === t);
    if (!row || !row.recipe) return null;
    return {
      id: row.id,
      meal_type: t,
      recipe: row.recipe as unknown as Recipe,
    };
  };

  return {
    plan,
    dayOfWeek,
    isWeekend,
    breakfast: byType("breakfast"),
    lunch: byType("lunch"),
    dinner: byType("dinner"),
  };
}

export async function getRecipe(
  supabase: DB,
  id: string,
): Promise<Recipe | null> {
  const { data } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}
