"use client";

import { useEffect, useRef, useState } from "react";
import { Timer, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

function fmt(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TimerChip({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      void audioRef.current?.close();
    };
  }, []);

  function ping() {
    try {
      audioRef.current ??= new AudioContext();
      const ctx = audioRef.current;
      const beep = (at: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
        gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + at + 0.02);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + at + 0.35,
        );
        osc.start(ctx.currentTime + at);
        osc.stop(ctx.currentTime + at + 0.36);
      };
      beep(0);
      beep(0.45);
      beep(0.9);
    } catch {
      // Audio unavailable — the visual "Done" state still fires.
    }
  }

  function start() {
    if (running) return;
    // Prime the AudioContext inside the user gesture (iOS requirement).
    audioRef.current ??= new AudioContext();
    void audioRef.current.resume();

    setDone(false);
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          setDone(true);
          ping();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setDone(false);
    setRemaining(seconds);
  }

  return (
    <button
      type="button"
      onClick={done || running ? reset : start}
      aria-label={
        done
          ? "Timer done, tap to reset"
          : running
            ? `Timer running, ${fmt(remaining)} remaining, tap to reset`
            : `Start ${fmt(seconds)} timer`
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium tabular-nums transition-colors",
        done
          ? "bg-accent text-accent-foreground"
          : running
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      )}
    >
      {done ? (
        <RotateCcw className="size-4" />
      ) : running ? (
        <Timer className="size-4" />
      ) : (
        <Play className="size-4" />
      )}
      {done ? "Done — reset" : fmt(remaining)}
    </button>
  );
}
