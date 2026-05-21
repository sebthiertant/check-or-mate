"use client";

import type { PlayerEntry } from "@/lib/topPlayers";

interface PlayerPickerProps {
  players: PlayerEntry[];
  selected: string[];
  onSelectionChange: (players: string[]) => void;
}

export function PlayerPicker({
  players,
  selected,
  onSelectionChange,
}: PlayerPickerProps) {
  if (players.length === 0) return null;

  function toggle(username: string) {
    const key = username.toLowerCase();
    const isSelected = selected.some((s) => s.toLowerCase() === key);
    onSelectionChange(
      isSelected
        ? selected.filter((s) => s.toLowerCase() !== key)
        : [...selected, username],
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-zinc-800">
      <span className="text-xs text-zinc-500 block mb-2">Players</span>
      <div className="flex flex-wrap gap-1.5">
        {players.map(({ username, maxRating }) => {
          const active = selected.some(
            (s) => s.toLowerCase() === username.toLowerCase(),
          );
          return (
            <button
              key={username}
              aria-pressed={active}
              onClick={() => toggle(username)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                active
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              {username}
              <span className="ml-1.5 text-zinc-600 tabular-nums text-[10px]">
                {maxRating}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
