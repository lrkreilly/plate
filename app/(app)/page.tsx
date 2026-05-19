import Link from "next/link";
import { Clock, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTodayMeals, type SlotWithRecipe } from "@/lib/plan";
import { getSupplementStacks } from "@/lib/supplements";
import { nzNow, formatDateHeader } from "@/lib/time";
import { SupplementStack } from "@/components/supplement-stack";
import { RatingModal } from "@/components/rating-modal";
import { cn } from "@/lib/utils";

const TAG_BG: Record<string, string> = {
  steak: "bg-tag-steak",
  chicken: "bg-tag-chicken",
  salmon: "bg-tag-salmon",
  legume: "bg-tag-legume",
  eggs: "bg-tag-eggs",
};

function ProteinPill({ tag }: { tag: string | null }) {
  if (!tag) return null;
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white capitalize",
        TAG_BG[tag] ?? "bg-primary",
      )}
    >
      {tag}
    </span>
  );
}

function Thumb({ slot, size }: { slot: SlotWithRecipe; size: "sm" | "lg" }) {
  const tagBg = slot.recipe.protein_tag
    ? TAG_BG[slot.recipe.protein_tag]
    : null;
  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-lg",
        size === "lg" ? "h-20 w-20" : "size-14",
        tagBg ?? "bg-primary",
      )}
    >
      {slot.recipe.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slot.recipe.image_url}
          alt={slot.recipe.name}
          className="size-full object-cover"
        />
      )}
    </div>
  );
}

function SmallMealCard({
  label,
  slot,
  collapsed,
}: {
  label: string;
  slot: SlotWithRecipe;
  collapsed: boolean;
}) {
  const body = (
    <Link
      href={`/recipe/${slot.recipe.id}`}
      className="bg-card flex items-center gap-3 rounded-xl p-3 shadow-sm"
    >
      <Thumb slot={slot} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs font-medium uppercase">
          {label}
        </p>
        <p className="truncate font-medium">{slot.recipe.name}</p>
        <p className="text-muted-foreground text-xs">{slot.recipe.prep_time}</p>
      </div>
      <ChevronRight className="text-muted-foreground size-5" />
    </Link>
  );

  if (!collapsed) return body;
  return (
    <details className="group">
      <summary className="bg-card text-muted-foreground flex cursor-pointer items-center justify-between rounded-xl p-3 text-sm shadow-sm">
        <span>
          <span className="font-medium uppercase">{label}</span> ·{" "}
          {slot.recipe.name}
        </span>
        <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
      </summary>
      <div className="mt-2">{body}</div>
    </details>
  );
}

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = nzNow();
  const today = await getTodayMeals(supabase);
  const stacks = user ? await getSupplementStacks(supabase, user.id) : null;

  const dinner = today?.dinner ?? null;
  let dinnerLog = null;
  if (dinner && user) {
    const { data } = await supabase
      .from("meal_logs")
      .select("rating, kids_verdict, notes")
      .eq("user_id", user.id)
      .eq("meal_slot_id", dinner.id)
      .eq("date", `${now.year}-${String(now.month).padStart(2, "0")}-${String(now.day).padStart(2, "0")}`)
      .maybeSingle();
    dinnerLog = data ?? null;
  }

  const pastEleven = now.hour >= 11;
  const afterFive = now.hour >= 17;

  return (
    <div className="space-y-4 py-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{formatDateHeader(now)}</h1>
          {today?.isWeekend && (
            <p className="text-muted-foreground text-xs">
              Weekend — showing Monday&apos;s plan
            </p>
          )}
        </div>
        {dinner && <ProteinPill tag={dinner.recipe.protein_tag} />}
      </header>

      {!today && (
        <div className="bg-card text-muted-foreground rounded-xl p-6 text-center text-sm shadow-sm">
          No active meal plan found. Run the seed in Supabase, or check your
          household.
        </div>
      )}

      {dinner && (
        <Link
          href={`/recipe/${dinner.recipe.id}`}
          className="bg-card block rounded-2xl p-4 shadow-sm"
        >
          <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
            Tonight&apos;s dinner
          </p>
          <div className="flex gap-4">
            <Thumb slot={dinner} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-[22px] leading-tight font-bold">
                {dinner.recipe.name}
              </p>
              <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <ProteinPill tag={dinner.recipe.protein_tag} />
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-4" />
                  {dinner.recipe.prep_time}
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {today?.breakfast && (
        <SmallMealCard
          label="Breakfast"
          slot={today.breakfast}
          collapsed={pastEleven}
        />
      )}
      {today?.lunch && (
        <SmallMealCard
          label="Lunch"
          slot={today.lunch}
          collapsed={pastEleven}
        />
      )}

      {stacks && (
        <>
          <SupplementStack
            title="Your morning stack"
            items={stacks.morning.items}
            streak={stacks.morning.streak}
          />
          <SupplementStack
            title="Your evening stack"
            items={stacks.evening.items}
            streak={stacks.evening.streak}
          />
        </>
      )}

      {dinner && afterFive && (
        <div className="bg-card rounded-xl p-4 shadow-sm">
          <p className="mb-2 text-sm font-medium">Tonight at dinner</p>
          <RatingModal
            slotId={dinner.id}
            recipeName={dinner.recipe.name}
            existing={dinnerLog}
            triggerLabel="Log dinner →"
          />
        </div>
      )}
    </div>
  );
}
