"use client";

import { useState, useTransition } from "react";
import { Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { logMeal } from "@/app/(app)/recipe/[id]/actions";
import { cn } from "@/lib/utils";

interface Props {
  slotId: string | null;
  recipeName: string;
  existing: { rating: number | null; kids_verdict: string | null; notes: string | null } | null;
  triggerLabel?: string;
}

export function RatingModal({
  slotId,
  recipeName,
  existing,
  triggerLabel = "Mark as cooked tonight",
}: Props) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [kids, setKids] = useState(existing?.kids_verdict ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!slotId) {
    return (
      <Button variant="secondary" className="w-full" disabled>
        Not on today&apos;s menu
      </Button>
    );
  }

  const alreadyLogged = existing?.rating != null;

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await logMeal(slotId!, rating, kids, notes);
      if (res.ok) {
        setOpen(false);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button className="w-full" variant={alreadyLogged ? "secondary" : "default"} />}
      >
        {alreadyLogged ? (
          <>
            <Check className="size-4" /> Logged — edit rating
          </>
        ) : (
          triggerLabel
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How was {recipeName}?</DialogTitle>
          <DialogDescription>Your rating only. Saved for tonight.</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
              className="p-1"
            >
              <Star
                className={cn(
                  "size-8 transition-colors",
                  n <= rating
                    ? "fill-accent text-accent"
                    : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="kids">Kids&apos; verdict</Label>
          <Input
            id="kids"
            value={kids}
            onChange={(e) => setKids(e.target.value)}
            placeholder="Ate it / mutiny / asked for seconds"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Note (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}

        <Button onClick={submit} disabled={pending || rating === 0} className="w-full">
          {pending ? "Saving…" : "Save"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
