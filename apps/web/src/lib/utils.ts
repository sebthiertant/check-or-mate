import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Scores, ScoreDimension } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  ];
  return dimensions.sort((a, b) => scores[b] - scores[a]).slice(0, count);
}

export function scoreColor(value: number): string {
  if (value >= 80) return "bg-amber-400";
  if (value >= 60) return "bg-amber-500";
  if (value >= 40) return "bg-amber-700";
  return "bg-zinc-600";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const MATE_SCORE = 30_000;

/**
 * Convert a centipawn evaluation (white POV) to a 0–100 percentage
 * for the eval rail (50 = equal, >50 = white winning, <50 = black winning).
 * Uses a tanh curve so the bar saturates smoothly near ±∞.
 */
export function cpToPercent(cp: number): number {
  if (cp >= MATE_SCORE) return 100;
  if (cp <= -MATE_SCORE) return 0;
  return 50 + 50 * Math.tanh(cp / 600);
}

/**
 * Format a centipawn value as a human-readable string (+1.5, -2.3, M+, M-).
 * Returned as e.g. "+1.5", "-2.3", "M+", "M-", "0.0"
 */
export function formatCp(cp: number): string {
  if (cp >= MATE_SCORE) return "M+";
  if (cp <= -MATE_SCORE) return "M-";
  const pawns = cp / 100;
  const sign = pawns > 0 ? "+" : "";
  return `${sign}${pawns.toFixed(1)}`;
}
