import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { nzDateString } from "@/lib/time";

type DB = SupabaseClient<Database>;
export type Supplement = Database["public"]["Tables"]["supplements"]["Row"];

export const SCHEDULE_OPTIONS = [
  { value: "morning_coffee", label: "Morning — with coffee" },
  { value: "morning_breakfast", label: "Morning — with breakfast" },
  { value: "with_meal", label: "With a meal" },
  { value: "anytime", label: "Anytime" },
  { value: "evening_bedtime", label: "Evening — before bed" },
] as const;

export async function getUserSupplements(
  supabase: DB,
  userId: string,
): Promise<Supplement[]> {
  const { data, error } = await supabase
    .from("supplements")
    .select("*")
    .eq("user_id", userId)
    .order("display_order", { ascending: true });
  if (error) console.error("getUserSupplements:", error.message);
  return data ?? [];
}

export interface StackItem {
  supplement: Supplement;
  takenToday: boolean;
}

export interface Stack {
  items: StackItem[];
  streak: number;
}

export interface SupplementStacks {
  morning: Stack;
  evening: Stack;
}

function isEvening(s: Supplement): boolean {
  const sched = s.schedule.toLowerCase();
  return (
    sched.includes("evening") ||
    sched.includes("bedtime") ||
    s.name.toLowerCase().includes("magnesium")
  );
}

function isoDaysAgo(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - n);
  return dt.toISOString().slice(0, 10);
}

// Consecutive days (counting back from today, or yesterday if today is not
// yet complete) where every enabled supplement in the stack was taken.
function computeStreak(
  stackIds: Set<string>,
  takenByDate: Map<string, Set<string>>,
  today: string,
): number {
  if (stackIds.size === 0) return 0;
  const complete = (date: string) => {
    const taken = takenByDate.get(date);
    if (!taken) return false;
    for (const id of stackIds) if (!taken.has(id)) return false;
    return true;
  };

  let streak = 0;
  let offset = complete(today) ? 0 : 1;
  // Cap the walk-back so a gap can't loop forever.
  for (; offset < 400; offset++) {
    if (complete(isoDaysAgo(today, offset))) streak++;
    else break;
  }
  return streak;
}

export async function getSupplementStacks(
  supabase: DB,
  userId: string,
): Promise<SupplementStacks> {
  const today = nzDateString();

  const { data: supps } = await supabase
    .from("supplements")
    .select("*")
    .eq("user_id", userId)
    .eq("enabled", true)
    .order("display_order", { ascending: true });

  const supplements = supps ?? [];
  const ids = supplements.map((s) => s.id);

  const { data: logs } = ids.length
    ? await supabase
        .from("supplement_logs")
        .select("supplement_id, date")
        .eq("user_id", userId)
        .gte("date", isoDaysAgo(today, 400))
    : { data: [] };

  const takenByDate = new Map<string, Set<string>>();
  for (const log of logs ?? []) {
    if (!takenByDate.has(log.date)) takenByDate.set(log.date, new Set());
    takenByDate.get(log.date)!.add(log.supplement_id);
  }
  const takenToday = takenByDate.get(today) ?? new Set<string>();

  const build = (members: Supplement[]): Stack => {
    const stackIds = new Set(members.map((m) => m.id));
    return {
      items: members.map((s) => ({
        supplement: s,
        takenToday: takenToday.has(s.id),
      })),
      streak: computeStreak(stackIds, takenByDate, today),
    };
  };

  return {
    morning: build(supplements.filter((s) => !isEvening(s))),
    evening: build(supplements.filter(isEvening)),
  };
}
