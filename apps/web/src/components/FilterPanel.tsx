"use client";

import { useState } from "react";
import { Check, Link, RotateCcw, SlidersHorizontal } from "lucide-react";
import { DIMENSION_LABELS, type ScoreDimension } from "@/lib/types";
import {
  DEFAULT_FILTERS,
  SCORE_DIMENSIONS,
  SORT_KEYS,
  type Filters,
  type SortKey,
} from "@/lib/filters";
import type { PlayerEntry } from "@/lib/topPlayers";
import { PlayerPicker } from "./PlayerPicker";

interface FilterPanelProps {
  filters: Filters;
  onUpdate: (updates: Partial<Filters>) => void;
  onReset: () => void;
  hasActive: boolean;
  topPlayers?: PlayerEntry[];
}

export function FilterPanel({
  filters,
  onUpdate,
  onReset,
  hasActive,
  topPlayers = [],
}: FilterPanelProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      aria-label="Filters"
      className="mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
          <SlidersHorizontal size={13} />
          <span>Filters</span>
        </div>

        <div className="flex items-center gap-2">
          <SortSelector
            value={filters.sort}
            onChange={(sort) => onUpdate({ sort })}
          />

          <button
            onClick={copyLink}
            title="Copy shareable link"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 transition-colors"
          >
            {copied ? (
              <Check size={11} className="text-amber-400" />
            ) : (
              <Link size={11} />
            )}
            <span>{copied ? "Copied!" : "Copy link"}</span>
          </button>

          {hasActive && (
            <button
              onClick={onReset}
              title="Reset all filters"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {SCORE_DIMENSIONS.map((dim) => (
          <DimensionSlider
            key={dim}
            dimension={dim}
            label={DIMENSION_LABELS[dim]}
            value={filters[dim]}
            onChange={(value) => onUpdate({ [dim]: value })}
          />
        ))}
      </div>
      <PlayerPicker
        players={topPlayers}
        selected={filters.players}
        onSelectionChange={(players) => onUpdate({ players })}
      />
    </section>
  );
}

interface DimensionSliderProps {
  dimension: ScoreDimension;
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function DimensionSlider({
  dimension,
  label,
  value,
  onChange,
}: DimensionSliderProps) {
  return (
    <div className="flex items-center gap-3 group">
      <label
        htmlFor={`slider-${dimension}`}
        className="w-28 shrink-0 text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors truncate cursor-pointer"
      >
        {label}
      </label>
      <input
        id={`slider-${dimension}`}
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="flex-1 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-amber-500"
        aria-label={`Minimum ${label} score`}
      />
      <span className="w-7 shrink-0 text-right text-xs font-mono tabular-nums text-zinc-400">
        {value > 0 ? value : <span className="text-zinc-700">—</span>}
      </span>
    </div>
  );
}

interface SortSelectorProps {
  value: SortKey;
  onChange: (key: SortKey) => void;
}

function SortSelector({ value, onChange }: SortSelectorProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-zinc-600 text-xs">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        aria-label="Sort by"
        className="bg-zinc-800 text-zinc-300 text-xs rounded px-2 py-1 border border-zinc-700 hover:border-zinc-600 transition-colors cursor-pointer"
      >
        <option value="overall">Overall</option>
        {SCORE_DIMENSIONS.map((dim) => (
          <option key={dim} value={dim}>
            {DIMENSION_LABELS[dim]}
          </option>
        ))}
      </select>
    </div>
  );
}

// Re-export DEFAULT_FILTERS for convenience in tests
export { DEFAULT_FILTERS };
