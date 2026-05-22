"use client";

interface PlayerChipProps {
  name: string;
  rating: number;
  active: boolean;
  onClick: () => void;
}

export function PlayerChip({ name, rating, active, onClick }: PlayerChipProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[12px] transition-all duration-150"
      style={
        active
          ? {
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-line)",
              color: "var(--text)",
            }
          : {
              background: "var(--panel-3)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }
      }
    >
      <span className="font-medium">{name}</span>
      <span style={{ color: "var(--text-dim)" }}>{rating}</span>
    </button>
  );
}
