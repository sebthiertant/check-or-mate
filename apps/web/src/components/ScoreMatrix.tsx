"use client";

import type { ScoreDimension } from "@/lib/types";
import { DIMENSION_LABELS } from "@/lib/types";
import { SCORE_DIMENSIONS } from "@/lib/filters";

interface ScoreMatrixProps {
  scores: Record<ScoreDimension, number>;
  mini?: boolean;
}

const SHORT_LABELS: Record<ScoreDimension, string> = {
  sacrifice:       "SAC",
  eval_swing:      "DRM",
  brilliancy:      "BRI",
  time_pressure:   "CLK",
  endgame_quality: "END",
  rating_upset:    "UPS",
  opening_rarity:  "RAR",
};

export function ScoreMatrix({ scores, mini = false }: ScoreMatrixProps) {
  return (
    <div className={`flex flex-col gap-0.5 ${mini ? "gap-0" : "gap-1"}`}>
      {SCORE_DIMENSIONS.map((dim) => {
        const value = scores[dim] ?? 0;
        const filled = Math.round(value / 10);
        return (
          <div key={dim} className="flex items-center gap-1.5">
            <span className="w-[28px] font-mono text-[10px] text-[var(--text-dim)] shrink-0">
              {SHORT_LABELS[dim]}
            </span>
            <div className="flex gap-px">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={`${mini ? "w-1.5 h-1.5" : "w-2 h-2"} rounded-sm transition-colors ${
                    i < filled
                      ? "bg-[var(--accent)]"
                      : "bg-[var(--border)]"
                  }`}
                />
              ))}
            </div>
            <span className="w-5 text-right font-mono text-[10px] text-[var(--text-muted)] tabular-nums">
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
