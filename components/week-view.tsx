"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, Clock } from "lucide-react";
import type { WeekDay, SlotWithRecipe } from "@/lib/plan";
import { setCurrentWeek } from "@/app/(app)/week/actions";
import { cn } from "@/lib/utils";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const TAG_BG: Record<string, string> = {
  steak: "bg-tag-steak",
  chicken: "bg-tag-chicken",
  salmon: "bg-tag-salmon",
  legume: "bg-tag-legume",
  eggs: "bg-tag-eggs",
};

function MealRow({ label, slot }: { label: string; slot: SlotWithRecipe | null }) {
  if (!slot) return null;
  return (
    <Link
      href={`/recipe/${slot.recipe.id}`}
      className="hover:bg-secondary/60 flex items-center justify-between rounded-lg px-2 py-2 text-sm"
    >
      <span>
        <span className="text-muted-foreground text-xs font-medium uppercase">
          {label}
        </span>
        <span className="ml-2">{slot.recipe.name}</span>
      </span>
      <span className="text-muted-foreground text-xs">
        {slot.recipe.prep_time}
      </span>
    </Link>
  );
}

export function WeekView({
  grid,
  currentWeek,
  todayDow,
}: {
  grid: WeekDay[];
  currentWeek: number;
  todayDow: number | null;
}) {
  const [open, setOpen] = useState<number | null>(todayDow);
  const [pending, startTransition] = useTransition();

  function switchWeek(w: 1 | 2) {
    if (w === currentWeek) return;
    startTransition(() => {
      void setCurrentWeek(w);
    });
  }

  return (
    <div className="space-y-4 py-4">
      <h1 className="text-2xl font-bold">Week</h1>

      <div className="bg-secondary inline-flex w-full rounded-lg p-1">
        {([1, 2] as const).map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => switchWeek(w)}
            disabled={pending}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
              currentWeek === w
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            Week {w}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {grid.map((day) => {
          const tagBg = day.dinner?.recipe.protein_tag
            ? TAG_BG[day.dinner.recipe.protein_tag]
            : null;
          const isToday = day.dayOfWeek === todayDow;
          const expanded = open === day.dayOfWeek;
          return (
            <li
              key={day.dayOfWeek}
              className={cn(
                "bg-card rounded-xl shadow-sm",
                isToday && "ring-primary ring-2",
              )}
            >
              <button
                type="button"
                onClick={() =>
                  setOpen(expanded ? null : day.dayOfWeek)
                }
                className="flex w-full items-center gap-3 p-3 text-left"
              >
                <div
                  className={cn(
                    "size-12 shrink-0 overflow-hidden rounded-lg",
                    tagBg ?? "bg-primary",
                  )}
                >
                  {day.dinner?.recipe.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={day.dinner.recipe.image_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {DOW[day.dayOfWeek - 1]}
                    {isToday && (
                      <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase">
                        Today
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm">
                    {day.dinner?.recipe.name ?? "—"}
                  </p>
                  {day.dinner && (
                    <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                      <Clock className="size-3" />
                      {day.dinner.recipe.prep_time}
                    </p>
                  )}
                </div>
                <ChevronDown
                  className={cn(
                    "text-muted-foreground size-5 transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </button>
              {expanded && (
                <div className="border-border space-y-1 border-t p-2">
                  <MealRow label="Breakfast" slot={day.breakfast} />
                  <MealRow label="Lunch" slot={day.lunch} />
                  <MealRow label="Dinner" slot={day.dinner} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
