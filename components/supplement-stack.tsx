"use client";

import { useState, useTransition } from "react";
import { Check, Flame } from "lucide-react";
import { toggleSupplement } from "@/app/(app)/actions";
import type { StackItem } from "@/lib/supplements";
import { cn } from "@/lib/utils";

export function SupplementStack({
  title,
  items,
  streak,
}: {
  title: string;
  items: StackItem[];
  streak: number;
}) {
  const [taken, setTaken] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map((i) => [i.supplement.id, i.takenToday])),
  );
  const [, startTransition] = useTransition();

  if (items.length === 0) return null;

  function toggle(id: string) {
    setTaken((t) => ({ ...t, [id]: !t[id] }));
    startTransition(async () => {
      const res = await toggleSupplement(id);
      if (!res.ok) setTaken((t) => ({ ...t, [id]: !t[id] })); // revert
    });
  }

  return (
    <section className="bg-card rounded-xl p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {streak > 0 && (
          <span className="bg-accent/15 text-accent-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
            <Flame className="text-accent size-3.5" />
            {streak} day{streak === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {items.map(({ supplement }) => {
          const isTaken = taken[supplement.id];
          return (
            <li key={supplement.id}>
              <button
                type="button"
                onClick={() => toggle(supplement.id)}
                aria-pressed={isTaken}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
                  isTaken ? "bg-secondary" : "hover:bg-secondary/60",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isTaken
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40",
                  )}
                >
                  {isTaken && <Check className="size-4" />}
                </span>
                <span className="flex-1">
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      isTaken && "text-muted-foreground line-through",
                    )}
                  >
                    {supplement.name}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {supplement.dose}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
