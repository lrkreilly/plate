"use client";

import Link from "next/link";
import { Settings, Pill, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function SettingsDrawer({ email }: { email: string | null }) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Settings"
            className="text-muted-foreground"
          />
        }
      >
        <Settings className="size-5" />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>{email ?? "Signed in"}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4">
          <Button
            variant="secondary"
            className="justify-start"
            render={<Link href="/supplements" />}
          >
            <Pill className="size-4" />
            Your supplements
          </Button>
          {/* Dark mode toggle ships in Sprint 6. */}
          <form action="/auth/signout" method="post">
            <Button
              type="submit"
              variant="ghost"
              className="text-muted-foreground w-full justify-start"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
