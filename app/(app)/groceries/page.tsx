import { createClient } from "@/lib/supabase/server";
import { getGroceries } from "@/lib/groceries";
import { GroceryList } from "@/components/grocery-list";

export default async function GroceriesPage() {
  const supabase = await createClient();
  const data = await getGroceries(supabase);

  if (!data) {
    return (
      <div className="py-6">
        <h1 className="text-2xl font-bold">Groceries</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          No active meal plan found.
        </p>
      </div>
    );
  }

  return <GroceryList data={data} />;
}
