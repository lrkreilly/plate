import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getRecipe,
  getTodayMeals,
  recipeIngredients,
  recipeSteps,
} from "@/lib/plan";
import { nzDateString } from "@/lib/time";
import { RecipeView } from "@/components/recipe-view";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const recipe = await getRecipe(supabase, id);
  if (!recipe) notFound();

  // Resolve which of today's slots this recipe fills (dinner wins) so
  // "Mark as cooked tonight" logs against the right meal_slot.
  const today = await getTodayMeals(supabase);
  const slotId =
    [today?.dinner, today?.lunch, today?.breakfast].find(
      (s) => s?.recipe.id === recipe.id,
    )?.id ?? null;

  let existing = null;
  if (slotId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("meal_logs")
        .select("rating, kids_verdict, notes")
        .eq("user_id", user.id)
        .eq("meal_slot_id", slotId)
        .eq("date", nzDateString())
        .maybeSingle();
      existing = data ?? null;
    }
  }

  return (
    <RecipeView
      recipe={recipe}
      ingredients={recipeIngredients(recipe)}
      steps={recipeSteps(recipe)}
      slotId={slotId}
      existing={existing}
    />
  );
}
