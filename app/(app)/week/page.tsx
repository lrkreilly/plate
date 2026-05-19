import { createClient } from "@/lib/supabase/server";
import { getActivePlan, getWeekGrid } from "@/lib/plan";
import { effectiveWeekday, nzNow } from "@/lib/time";
import { WeekView } from "@/components/week-view";

export default async function WeekPage() {
  const supabase = await createClient();
  const plan = await getActivePlan(supabase);

  if (!plan) {
    return (
      <div className="py-6">
        <h1 className="text-2xl font-bold">Week</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          No active meal plan found.
        </p>
      </div>
    );
  }

  const grid = await getWeekGrid(supabase, plan.id, plan.current_week);
  const { dayOfWeek, isWeekend } = effectiveWeekday(nzNow());

  return (
    <WeekView
      grid={grid}
      currentWeek={plan.current_week}
      todayDow={isWeekend ? null : dayOfWeek}
    />
  );
}
