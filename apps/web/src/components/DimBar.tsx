"use client";

interface DimBarProps {
  label: string;
  value: number;
  compact?: boolean;
}

export function DimBar({ label, value, compact = false }: DimBarProps) {
  const labelWidth = compact ? "w-[90px]" : "w-[110px]";
  const valueWidth = compact ? "w-[28px]" : "w-[32px]";
  const trackHeight = "h-1";

  return (
    <div className={`grid items-center gap-2 ${compact ? "gap-x-1.5" : "gap-x-2"}`}
      style={{ gridTemplateColumns: `${compact ? "90px" : "110px"} 1fr ${compact ? "28px" : "32px"}` }}>
      <span
        className={`${labelWidth} truncate font-mono text-[11px] text-[var(--text-muted)]`}
        title={label}
      >
        {label}
      </span>
      <div className={`${trackHeight} rounded-full bg-[var(--border)] overflow-hidden`}>
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`${valueWidth} text-right font-mono text-[11px] text-[var(--text-muted)] tabular-nums`}>
        {value}
      </span>
    </div>
  );
}
