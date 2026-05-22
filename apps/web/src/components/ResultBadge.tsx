import type { Result } from "@/lib/types";

const LABELS: Record<Result, string> = {
  "1-0": "Blancs gagnent",
  "0-1": "Noirs gagnent",
  "1/2-1/2": "Nulle",
};

interface ResultBadgeProps {
  result: Result;
}

const BASE =
  "inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[11px] font-medium";

export function ResultBadge({ result }: ResultBadgeProps) {
  if (result === "1-0") {
    return (
      <span
        className={BASE}
        style={{ background: "rgba(245,233,212,0.12)", color: "#e8d6b3" }}
        title={LABELS[result]}
      >
        1-0
      </span>
    );
  }
  if (result === "0-1") {
    return (
      <span
        className={BASE}
        style={{
          background: "var(--panel-3)",
          color: "var(--text-muted)",
          border: "1px solid var(--border)",
        }}
        title={LABELS[result]}
      >
        0-1
      </span>
    );
  }
  return (
    <span
      className={BASE}
      style={{ background: "var(--panel-3)", color: "var(--text-muted)" }}
      title={LABELS[result]}
    >
      ½-½
    </span>
  );
}
