import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getActivePlan } from "@/lib/plan";
import { getSupplementStacks } from "@/lib/supplements";
import { nzNow } from "@/lib/time";

type DB = SupabaseClient<Database>;

function daysAgoNz(n: number): string {
  const now = nzNow();
  const dt = new Date(Date.UTC(now.year, now.month - 1, now.day));
  dt.setUTCDate(dt.getUTCDate() - n);
  return dt.toISOString().slice(0, 10);
}

export interface UserAvg {
  name: string;
  avg: number | null;
  count: number;
}
export interface DinnerStat {
  recipeId: string;
  name: string;
  imageUrl: string | null;
  proteinTag: string | null;
  avg: number;
  count: number;
}
export interface Adherence {
  name: string;
  pct: number;
}
export interface Stats {
  userAvgs: UserAvg[];
  topDinners: DinnerStat[];
  bottomDinners: DinnerStat[];
  adherence: Adherence[];
  groceryWeekPct: number | null;
  morningStreak: number;
  eveningStreak: number;
}

interface MealLogJoin {
  rating: number | null;
  user_id: string;
  date: string;
  meal_slot: {
    meal_type: string;
    recipe: {
      id: string;
      name: string;
      image_url: string | null;
      protein_tag: string | null;
    } | null;
  } | null;
}

export async function getStats(
  supabase: DB,
  userId: string,
): Promise<Stats> {
  const cutoff30 = daysAgoNz(30);

  const { data: usersData } = await supabase
    .from("users")
    .select("id, display_name, email");
  const nameOf = (id: string) => {
    const u = usersData?.find((x) => x.id === id);
    return u?.display_name || u?.email?.split("@")[0] || "User";
  };

  const { data: logsRaw, error: logErr } = await supabase
    .from("meal_logs")
    .select(
      "rating, user_id, date, meal_slot:meal_slots(meal_type, recipe:recipes(id, name, image_url, protein_tag))",
    );
  if (logErr) console.error("getStats meal_logs:", logErr.message);
  const logs = (logsRaw ?? []) as unknown as MealLogJoin[];

  const dinnerLogs = logs.filter(
    (l) => l.meal_slot?.meal_type === "dinner" && l.rating != null,
  );

  // Per-user avg dinner rating, last 30 days.
  const byUser = new Map<string, { sum: number; n: number }>();
  for (const l of dinnerLogs) {
    if (l.date < cutoff30) continue;
    const agg = byUser.get(l.user_id) ?? { sum: 0, n: 0 };
    agg.sum += l.rating!;
    agg.n += 1;
    byUser.set(l.user_id, agg);
  }
  const memberIds = new Set<string>([
    userId,
    ...(usersData ?? []).map((u) => u.id),
  ]);
  const userAvgs: UserAvg[] = [...memberIds].map((id) => {
    const agg = byUser.get(id);
    return {
      name: nameOf(id),
      avg: agg ? Math.round((agg.sum / agg.n) * 10) / 10 : null,
      count: agg?.n ?? 0,
    };
  });

  // Top / bottom dinners by rating, all-time.
  const byRecipe = new Map<string, DinnerStat & { sum: number }>();
  for (const l of dinnerLogs) {
    const r = l.meal_slot?.recipe;
    if (!r) continue;
    const cur =
      byRecipe.get(r.id) ??
      ({
        recipeId: r.id,
        name: r.name,
        imageUrl: r.image_url,
        proteinTag: r.protein_tag,
        avg: 0,
        count: 0,
        sum: 0,
      } as DinnerStat & { sum: number });
    cur.sum += l.rating!;
    cur.count += 1;
    cur.avg = Math.round((cur.sum / cur.count) * 10) / 10;
    byRecipe.set(r.id, cur);
  }
  const ranked = [...byRecipe.values()].sort(
    (a, b) => b.avg - a.avg || b.count - a.count,
  );
  const topDinners = ranked.slice(0, 3);
  const bottomDinners =
    ranked.length > 3 ? ranked.slice(-2).reverse() : [];

  // Supplement adherence (yours), last 30 days.
  const { data: supps } = await supabase
    .from("supplements")
    .select("id, name")
    .eq("user_id", userId)
    .eq("enabled", true)
    .order("display_order", { ascending: true });
  const { data: suppLogs } = await supabase
    .from("supplement_logs")
    .select("supplement_id, date")
    .eq("user_id", userId)
    .gte("date", cutoff30);
  const takenCount = new Map<string, Set<string>>();
  for (const l of suppLogs ?? []) {
    if (!takenCount.has(l.supplement_id))
      takenCount.set(l.supplement_id, new Set());
    takenCount.get(l.supplement_id)!.add(l.date);
  }
  const adherence: Adherence[] = (supps ?? []).map((s) => ({
    name: s.name,
    pct: Math.round(((takenCount.get(s.id)?.size ?? 0) / 30) * 100),
  }));

  // Grocery completion — current week.
  let groceryWeekPct: number | null = null;
  const plan = await getActivePlan(supabase);
  if (plan) {
    const { count: total } = await supabase
      .from("grocery_items")
      .select("*", { count: "exact", head: true })
      .eq("plan_id", plan.id)
      .eq("week", plan.current_week);
    const { count: done } = await supabase
      .from("grocery_checks")
      .select("*", { count: "exact", head: true })
      .eq("household_id", plan.household_id)
      .eq("week_starting", plan.week_started_on)
      .eq("checked", true);
    if (total && total > 0) {
      groceryWeekPct = Math.round(((done ?? 0) / total) * 100);
    }
  }

  const stacks = await getSupplementStacks(supabase, userId);

  return {
    userAvgs,
    topDinners,
    bottomDinners,
    adherence,
    groceryWeekPct,
    morningStreak: stacks.morning.streak,
    eveningStreak: stacks.evening.streak,
  };
}
