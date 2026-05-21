import { topDimensions } from "@/lib/utils"
import { DIMENSION_LABELS, type Scores } from "@/lib/types"
import { ScoreBar } from "./ScoreBar"

interface DimensionBarsProps {
  scores: Scores
}

export function DimensionBars({ scores }: DimensionBarsProps) {
  const dimensions = topDimensions(scores, 4)

  return (
    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-zinc-800">
      {dimensions.map((dim) => (
        <ScoreBar
          key={dim}
          label={DIMENSION_LABELS[dim]}
          value={scores[dim]}
        />
      ))}
    </div>
  )
}
