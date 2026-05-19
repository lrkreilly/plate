"use client";

import { useState, useTransition } from "react";
import { Trash2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SCHEDULE_OPTIONS, type Supplement } from "@/lib/supplements";
import {
  addSupplement,
  updateSupplement,
  setSupplementEnabled,
  deleteSupplement,
} from "@/app/(app)/supplements/actions";
import { cn } from "@/lib/utils";

const selectCls =
  "border-input bg-background w-full rounded-lg border px-3 py-2 text-sm outline-none";

function ScheduleSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select name="schedule" defaultValue={defaultValue} className={selectCls}>
      {SCHEDULE_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SupplementRow({ s }: { s: Supplement }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await updateSupplement(s.id, fd);
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        })
      }
      className="bg-card space-y-3 rounded-xl p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <input
          name="name"
          defaultValue={s.name}
          className="flex-1 bg-transparent text-base font-semibold outline-none"
        />
        <button
          type="button"
          role="switch"
          aria-checked={s.enabled}
          onClick={() =>
            startTransition(() => {
              void setSupplementEnabled(s.id, !s.enabled);
            })
          }
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            s.enabled ? "bg-primary" : "bg-muted-foreground/30",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-white transition-all",
              s.enabled ? "left-[1.375rem]" : "left-0.5",
            )}
          />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Dose</Label>
          <Input name="dose" defaultValue={s.dose} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Reminder time</Label>
          <Input
            type="time"
            name="notification_time"
            defaultValue={s.notification_time?.slice(0, 5) ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Schedule</Label>
        <ScheduleSelect defaultValue={s.schedule} />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Notes</Label>
        <Input name="notes" defaultValue={s.notes ?? ""} />
      </div>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          className="text-destructive"
          onClick={() => {
            if (confirm(`Delete ${s.name}?`))
              startTransition(() => {
                void deleteSupplement(s.id);
              });
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
        <Button type="submit" disabled={pending}>
          {saved ? (
            <>
              <Check className="size-4" /> Saved
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </form>
  );
}

function AddSupplement() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="w-full" />}>
        <Plus className="size-4" />
        Add supplement
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add supplement</DialogTitle>
        </DialogHeader>
        <form
          action={(fd) =>
            startTransition(async () => {
              const res = await addSupplement(fd);
              if (res.ok) setOpen(false);
            })
          }
          className="space-y-3"
        >
          <div className="space-y-1">
            <Label htmlFor="a-name">Name</Label>
            <Input id="a-name" name="name" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="a-dose">Dose</Label>
            <Input id="a-dose" name="dose" required placeholder="e.g. 500 mg" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="a-sched">Schedule</Label>
            <ScheduleSelect defaultValue="anytime" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="a-time">Reminder time (optional)</Label>
            <Input id="a-time" type="time" name="notification_time" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Adding…" : "Add"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SupplementsEditor({
  supplements,
}: {
  supplements: Supplement[];
}) {
  return (
    <div className="space-y-4 py-4">
      <h1 className="text-2xl font-bold">Your supplements</h1>
      {supplements.map((s) => (
        <SupplementRow key={s.id} s={s} />
      ))}
      <AddSupplement />
    </div>
  );
}
