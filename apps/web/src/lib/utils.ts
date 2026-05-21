import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Scores, ScoreDimension } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function topDimensions(scores: Scores, count = 4): ScoreDimension[] {
  const dimensions: ScoreDimension[] = [
    "sacrifice",
    "eval_swing",
    "brilliancy",
    "time_pressure",
    "endgame_quality",
    "rating_upset",
    "opening_rarity",
  ]
  return dimensions
    .sort((a, b) => scores[b] - scores[a])
    .slice(0, count)
}

export function scoreColor(value: number): string {
  if (value >= 80) return "bg-amber-400"
  if (value >= 60) return "bg-amber-500"
  if (value >= 40) return "bg-amber-700"
  return "bg-zinc-600"
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
