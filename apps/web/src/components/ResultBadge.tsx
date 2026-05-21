import { cn } from "@/lib/utils";
import type { Result } from "@/lib/types";

const STYLES: Record<Result, string> = {
  "1-0": "bg-zinc-100 text-zinc-900",
  "0-1": "bg-zinc-800 text-zinc-200 border border-zinc-600",
  "1/2-1/2": "bg-zinc-700 text-zinc-300",
};

const LABELS: Record<Result, string> = {
  "1-0": "White wins",
  "0-1": "Black wins",
  "1/2-1/2": "Draw",
};

interface ResultBadgeProps {
  result: Result;
}

export function ResultBadge({ result }: ResultBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium",
        STYLES[result],
      )}
      title={LABELS[result]}
    >
      {result}
    </span>
  );
}
