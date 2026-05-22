"use client";

import type { ScoreDimension } from "@/lib/types";
import { SCORE_DIMENSIONS } from "@/lib/filters";
import { DIMENSION_LABELS } from "@/lib/types";

interface ScoreStackProps {
  scores: Record<ScoreDimension, number>;
}

export function ScoreStack({ scores }: ScoreStackProps) {
  const total = SCORE_DIMENSIONS.reduce((s, d) => s + (scores[d] ?? 0), 0) || 1;

  return (
    <div className="space-y-2">
      <div className="flex h-2 rounded-full overflow-hidden">
        {SCORE_DIMENSIONS.map((dim, i) => {
          const value = scores[dim] ?? 0;
          const pct = (value / total) * 100;
          const hue = i * (360 / SCORE_DIMENSIONS.length);
          return (
            <div
              key={dim}
              title={`${DIMENSION_LABELS[dim]}: ${value}`}
              style={{
                width: `${pct}%`,
                background: `oklch(0.68 0.12 ${hue})`,
              }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {SCORE_DIMENSIONS.map((dim, i) => {
          const hue = i * (360 / SCORE_DIMENSIONS.length);
          return (
            <span
              key={dim}
              className="flex items-center gap-1 font-mono text-[10px] text-[var(--text-muted)]"
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: `oklch(0.68 0.12 ${hue})` }}
              />
              {DIMENSION_LABELS[dim]}
              <span className="text-[var(--text-dim)]">{scores[dim] ?? 0}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
