import { formatDate } from "@/lib/utils";
import type { Game } from "@/lib/types";
import { ResultBadge } from "./ResultBadge";
import { DimensionBars } from "./DimensionBars";

const TIME_CLASS_LABEL: Record<Game["time_class"], string> = {
  bullet: "Bullet",
  blitz: "Blitz",
  rapid: "Rapid",
  classical: "Classical",
};

interface GameCardProps {
  game: Game;
  rank: number;
}

function Players({ game }: { game: Game }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-zinc-100 font-semibold">{game.white}</span>
        <span className="text-zinc-600 text-sm tabular-nums">
          ({game.white_rating})
        </span>
        <span className="text-zinc-600 text-xs mx-1">vs</span>
        <span className="text-zinc-100 font-semibold">{game.black}</span>
        <span className="text-zinc-600 text-sm tabular-nums">
          ({game.black_rating})
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <ResultBadge result={game.result} />
        <span className="text-zinc-600 text-xs">·</span>
        <span className="text-zinc-500 text-xs">
          {TIME_CLASS_LABEL[game.time_class]}
        </span>
        <span className="text-zinc-600 text-xs">·</span>
        <span className="text-zinc-600 text-xs font-mono">{game.eco}</span>
        <span className="text-zinc-600 text-xs">·</span>
        <span className="text-zinc-500 text-xs">{game.opening_name}</span>
      </div>
      <div className="text-zinc-600 text-xs mt-1">{formatDate(game.date)}</div>
    </div>
  );
}

function OverallScore({ value }: { value: number }) {
  return (
    <div className="shrink-0 text-right ml-6">
      <div className="text-4xl font-bold text-amber-400 tabular-nums leading-none">
        {value}
      </div>
      <div className="text-zinc-600 text-xs mt-1">score</div>
    </div>
  );
}

export function GameCard({ game, rank }: GameCardProps) {
  return (
    <article className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <span className="shrink-0 text-xs font-mono text-zinc-600 pt-1 w-6 text-right">
            {String(rank).padStart(2, "0")}
          </span>
          <Players game={game} />
        </div>
        <OverallScore value={game.scores.overall} />
      </div>
      <div className="pl-10">
        <DimensionBars scores={game.scores} />
      </div>
    </article>
  );
}
