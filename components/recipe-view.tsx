"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  Clock,
  Flame,
  CookingPot,
  ChefHat,
  Salad,
  Lightbulb,
} from "lucide-react";
import { TimerChip } from "@/components/timer-chip";
import { RatingModal } from "@/components/rating-modal";
import { scaleIngredient, servingsFactor } from "@/lib/ingredients";
import type { Recipe, RecipeStep } from "@/lib/plan";
import { cn } from "@/lib/utils";

const TAG_BG: Record<string, string> = {
  steak: "bg-tag-steak",
  chicken: "bg-tag-chicken",
  salmon: "bg-tag-salmon",
  legume: "bg-tag-legume",
  eggs: "bg-tag-eggs",
};

const METHOD_ICON: Record<string, typeof Flame> = {
  no_cook: Salad,
  stovetop: Flame,
  slow_cooker: CookingPot,
  sheet_pan: ChefHat,
  oven: Flame,
};

function methodLabel(m: string | null) {
  if (!m) return null;
  return m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  recipe: Recipe;
  ingredients: string[];
  steps: RecipeStep[];
  slotId: string | null;
  existing:
    | { rating: number | null; kids_verdict: string | null; notes: string | null }
    | null;
}

export function RecipeView({ recipe, ingredients, steps, slotId, existing }: Props) {
  const [servings, setServings] = useState(recipe.default_servings);
  const factor = servingsFactor(servings, recipe.default_servings);
  const tagBg = recipe.protein_tag ? TAG_BG[recipe.protein_tag] : null;
  const MethodIcon =
    (recipe.cooking_method && METHOD_ICON[recipe.cooking_method]) || ChefHat;

  return (
    <article className="-mx-4 pb-8">
      {/* Hero */}
      <div className="relative aspect-video w-full overflow-hidden">
        {recipe.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="size-full object-cover"
          />
        ) : (
          <div
            className={cn(
              "flex size-full items-center justify-center p-6",
              tagBg ?? "bg-primary",
            )}
          >
            <span className="text-center text-2xl font-bold text-white/90">
              {recipe.name}
            </span>
          </div>
        )}
        <Link
          href="/"
          aria-label="Back to today"
          className="bg-background/80 text-foreground absolute top-3 left-3 rounded-full p-2 backdrop-blur"
        >
          <ArrowLeft className="size-5" />
        </Link>
      </div>

      <div className="space-y-6 px-4 pt-5">
        {/* Title + tag */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{recipe.name}</h1>
          {recipe.protein_tag && (
            <span
              className={cn(
                "inline-block rounded-full px-3 py-1 text-xs font-semibold text-white capitalize",
                tagBg ?? "bg-primary",
              )}
            >
              {recipe.protein_tag}
            </span>
          )}
        </div>

        {/* Quick info row */}
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" />
            {recipe.prep_time}
          </span>
          {recipe.cooking_method && (
            <span className="inline-flex items-center gap-1.5">
              <MethodIcon className="size-4" />
              {methodLabel(recipe.cooking_method)}
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-2">
            <button
              type="button"
              aria-label="Fewer servings"
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              className="bg-secondary text-secondary-foreground rounded-full p-1.5"
            >
              <Minus className="size-4" />
            </button>
            <span className="text-foreground min-w-16 text-center font-medium">
              {servings} {servings === 1 ? "serving" : "servings"}
            </span>
            <button
              type="button"
              aria-label="More servings"
              onClick={() => setServings((s) => Math.min(20, s + 1))}
              className="bg-secondary text-secondary-foreground rounded-full p-1.5"
            >
              <Plus className="size-4" />
            </button>
          </span>
        </div>

        {/* Ingredients */}
        <section>
          <h2 className="mb-2 text-lg font-semibold">Ingredients</h2>
          <ul className="space-y-1.5">
            {ingredients.map((line, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-accent">•</span>
                <span>{scaleIngredient(line, factor)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Steps */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Cooking method</h2>
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  {i + 1}
                </span>
                <div className="space-y-2 pt-0.5">
                  <p className="text-sm">
                    <span className="font-semibold">{step.title}</span>{" "}
                    {step.content}
                  </p>
                  {step.timer_seconds ? (
                    <TimerChip seconds={step.timer_seconds} />
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Notes */}
        {recipe.notes && (
          <p className="text-muted-foreground border-l-2 border-border pl-3 text-sm italic">
            {recipe.notes}
          </p>
        )}

        {/* Cook-double banner */}
        {recipe.cook_double && (
          <div className="bg-accent/15 text-accent-foreground flex items-start gap-2 rounded-lg p-3 text-sm">
            <Lightbulb className="text-accent mt-0.5 size-4 shrink-0" />
            <span>Cook double tonight — this is tomorrow&apos;s lunch.</span>
          </div>
        )}

        {/* Bottom action */}
        <div className="pt-2">
          <RatingModal
            slotId={slotId}
            recipeName={recipe.name}
            existing={existing}
          />
        </div>
      </div>
    </article>
  );
}
