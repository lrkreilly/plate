import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nzMondayOfThisWeek } from "@/lib/time";

// Sunday auto-rotation. Idempotent and date-based: it flips only when the NZ
// week has actually rolled over (week_started_on < this NZ Monday), so the
// exact cron time / DST offset doesn't matter — a missed run self-corrects on
// the next run. Manual /week toggles mid-week are preserved because they only
// change current_week, not week_started_on, so this won't re-trigger.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const monday = nzMondayOfThisWeek();

  const { data: plans, error } = await supabase
    .from("plans")
    .select("id, household_id, current_week, week_started_on")
    .eq("active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rotated: string[] = [];

  for (const plan of plans ?? []) {
    if (plan.week_started_on >= monday) continue; // already current

    const nextWeek = plan.current_week === 1 ? 2 : 1;

    const { error: upErr } = await supabase
      .from("plans")
      .update({ current_week: nextWeek, week_started_on: monday })
      .eq("id", plan.id);
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    // Checks are keyed by week_starting, so the new week is already clean;
    // drop stale rows from prior weeks to keep the table tidy.
    await supabase
      .from("grocery_checks")
      .delete()
      .eq("household_id", plan.household_id)
      .lt("week_starting", monday);

    rotated.push(plan.id);
  }

  return NextResponse.json({ ok: true, monday, rotated });
}
