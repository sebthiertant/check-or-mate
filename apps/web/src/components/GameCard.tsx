"use client";

import { useMemo } from "react";
import type { Game, ScoreDimension } from "@/lib/types";
import { DIMENSION_LABELS } from "@/lib/types";
import { SCORE_DIMENSIONS } from "@/lib/filters";
import { ResultBadge } from "./ResultBadge";
import { DimBar } from "./DimBar";
import { ScoreMatrix } from "./ScoreMatrix";
import { ScoreStack } from "./ScoreStack";
import { formatDate } from "@/lib/utils";

const TIME_CLASS_LABEL: Record<Game["time_class"], string> = {
  bullet:    "Bullet",
  blitz:     "Blitz",
  rapid:     "Rapid",
  classical: "Classical",
};

interface GameCardProps {
  game: Game;
  rank: number;
  selected: boolean;
  onClick: () => void;
}

export function GameCard({ game, rank, selected, onClick }: GameCardProps) {
  const topDims = useMemo(
    () =>
      SCORE_DIMENSIONS.map((dim) => ({ dim, value: game.scores[dim] ?? 0 }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 3),
    [game.scores],
  );

  return (
    <article
      className="relative grid items-start gap-x-3 rounded-xl px-4 py-3 transition-all duration-150 cursor-pointer select-none"
      style={{
        gridTemplateColumns: "36px 1fr 80px",
        background: selected ? "var(--panel-2)" : "var(--panel)",
        border: `1px solid ${selected ? "var(--accent-line)" : "var(--border)"}`,
        boxShadow: selected ? "inset 3px 0 0 var(--accent)" : "none",
      }}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onClick(); }}
      onMouseEnter={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
          (e.currentTarget as HTMLElement).style.background = "var(--panel-2)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLElement).style.background = "var(--panel)";
        }
      }}
    >
      {/* Rank */}
      <div
        className="font-mono text-[11px] pt-0.5 text-right tabular-nums"
        style={{ color: selected ? "var(--accent)" : "var(--text-dim)" }}
      >
        {String(rank).padStart(2, "0")}
      </div>

      {/* Body */}
      <div className="min-w-0 flex flex-col gap-1.5">
        {/* Players */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="w-2 h-2 rounded-sm shrink-0 inline-block self-center" style={{ background: "#e9e5dc" }} />
          <span className="font-mono font-semibold text-[14px]" style={{ color: "var(--text)" }}>
            {game.white}
          </span>
          <span className="font-mono text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
            {game.white_rating}
          </span>
          <span className="font-mono text-[11px]" style={{ color: "var(--text-dim)" }}>vs</span>
          <span className="w-2 h-2 rounded-sm shrink-0 inline-block self-center" style={{ background: "#3a342d" }} />
          <span className="font-mono font-semibold text-[14px]" style={{ color: "var(--text)" }}>
            {game.black}
          </span>
          <span className="font-mono text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
            {game.black_rating}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <ResultBadge result={game.result} />
          <span className="font-mono text-[11px]" style={{ color: "var(--text-dim)" }}>·</span>
          <span className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
            {TIME_CLASS_LABEL[game.time_class]}
          </span>
          <span className="font-mono text-[11px]" style={{ color: "var(--text-dim)" }}>·</span>
          <code className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
            {game.eco}
          </code>
          <span className="font-mono text-[11px]" style={{ color: "var(--text-dim)" }}>·</span>
          <span className="font-mono text-[11px]" style={{ color: "var(--text-dim)" }}>
            {formatDate(game.date)}
          </span>
        </div>

        {/* Top 3 dimensions */}
        <div className="flex flex-col gap-0.5 mt-0.5">
          {topDims.map(({ dim, value }) => (
            <DimBar
              key={dim}
              label={DIMENSION_LABELS[dim as ScoreDimension]}
              value={value}
              compact
            />
          ))}
        </div>
      </div>

      {/* Score */}
      <div className="flex flex-col items-end justify-start pt-0.5">
        <div
          className="font-mono font-semibold tabular-nums leading-none"
          style={{
            fontSize: selected ? "36px" : "32px",
            color: "var(--accent)",
            transition: "font-size 0.15s ease",
          }}
        >
          {game.scores.overall}
        </div>
        <div
          className="font-mono uppercase text-[10px] mt-1 tracking-widest"
          style={{ color: "var(--text-dim)", letterSpacing: "0.1em" }}
        >
          score
        </div>
      </div>
    </article>
  );
}
