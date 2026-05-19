"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORY_ORDER,
  CATEGORY_LABEL,
  type GroceryData,
  type GroceryRow,
} from "@/lib/groceries";
import { setGroceryCheck, resetGroceries } from "@/app/(app)/groceries/actions";
import { cn } from "@/lib/utils";

function Row({
  label,
  quantity,
  checked,
  onToggle,
}: {
  label: string;
  quantity: string | null;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className="flex w-full items-center gap-3 rounded-lg p-2 text-left"
    >
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-lg border-2 transition-colors",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40",
        )}
      >
        {checked && <Check className="size-6" />}
      </span>
      <span className="flex-1">
        <span
          className={cn(
            "block font-medium",
            checked && "text-muted-foreground line-through",
          )}
        >
          {label}
        </span>
        {quantity && (
          <span className="text-muted-foreground block text-sm">
            {quantity}
          </span>
        )}
      </span>
    </button>
  );
}

export function GroceryList({ data }: { data: GroceryData }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(data.rows.map((r) => [r.id, r.checked])),
  );
  const [adhoc, setAdhoc] = useState<{ text: string; done: boolean }[]>([]);
  const [adhocText, setAdhocText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reconcile when server data changes (e.g. after a realtime refresh).
  useEffect(() => {
    setChecked(Object.fromEntries(data.rows.map((r) => [r.id, r.checked])));
  }, [data.rows]);

  // Live household sync: any change to grocery_checks → refetch server data.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`grocery:${data.householdId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "grocery_checks",
          filter: `household_id=eq.${data.householdId}`,
        },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [data.householdId, router]);

  function toggle(row: GroceryRow) {
    const next = !checked[row.id];
    setChecked((c) => ({ ...c, [row.id]: next }));
    startTransition(async () => {
      const res = await setGroceryCheck(row.id, next);
      if (!res.ok) setChecked((c) => ({ ...c, [row.id]: !next }));
    });
  }

  function reset() {
    if (!confirm("Clear all ticks for this week?")) return;
    setChecked({});
    setAdhoc([]);
    startTransition(() => {
      void resetGroceries();
    });
  }

  function addAdhoc(e: React.FormEvent) {
    e.preventDefault();
    const t = adhocText.trim();
    if (!t) return;
    setAdhoc((a) => [...a, { text: t, done: false }]);
    setAdhocText("");
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-5 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Groceries</h1>
          <p className="text-muted-foreground text-sm">
            Week {data.week} shopping list
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <RotateCcw className="size-4" />
          Reset
        </button>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const items = data.rows.filter((r) => r.category === cat);
        if (items.length === 0) return null;
        const todo = items.filter((r) => !checked[r.id]);
        const got = items.filter((r) => checked[r.id]);
        return (
          <section key={cat} className="bg-card rounded-xl p-3 shadow-sm">
            <h2 className="px-2 pb-1 text-sm font-semibold uppercase">
              {CATEGORY_LABEL[cat]}
            </h2>
            <ul>
              {todo.map((r) => (
                <li key={r.id}>
                  <Row
                    label={r.name}
                    quantity={r.quantity}
                    checked={false}
                    onToggle={() => toggle(r)}
                  />
                </li>
              ))}
            </ul>
            {got.length > 0 && (
              <div className="mt-2 border-t border-border pt-2">
                <p className="text-muted-foreground px-2 pb-1 text-xs font-medium">
                  Got it ({got.length})
                </p>
                <ul>
                  {got.map((r) => (
                    <li key={r.id}>
                      <Row
                        label={r.name}
                        quantity={r.quantity}
                        checked
                        onToggle={() => toggle(r)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}

      <section className="bg-card rounded-xl p-3 shadow-sm">
        <h2 className="px-2 pb-1 text-sm font-semibold uppercase">Extra</h2>
        <ul>
          {adhoc.map((a, i) => (
            <li key={i}>
              <Row
                label={a.text}
                quantity={null}
                checked={a.done}
                onToggle={() =>
                  setAdhoc((list) =>
                    list.map((x, j) =>
                      j === i ? { ...x, done: !x.done } : x,
                    ),
                  )
                }
              />
            </li>
          ))}
        </ul>
        <form onSubmit={addAdhoc} className="flex gap-2 p-2">
          <input
            ref={inputRef}
            value={adhocText}
            onChange={(e) => setAdhocText(e.target.value)}
            placeholder="Add an item…"
            className="border-input bg-background flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            aria-label="Add item"
            className="bg-secondary text-secondary-foreground rounded-lg px-3"
          >
            <Plus className="size-5" />
          </button>
        </form>
      </section>
    </div>
  );
}
