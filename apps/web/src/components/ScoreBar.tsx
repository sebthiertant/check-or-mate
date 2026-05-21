import { scoreColor } from "@/lib/utils"

interface ScoreBarProps {
  label: string
  value: number
}

export function ScoreBar({ label, value }: ScoreBarProps) {
  return (
    <div className="flex items-center gap-3 group">
      <span className="w-28 shrink-0 text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors truncate">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${scoreColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-7 shrink-0 text-right text-xs font-mono text-zinc-400 tabular-nums">
        {value}
      </span>
    </div>
  )
}
