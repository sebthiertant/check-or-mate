import type { Game } from "@/lib/types";
import { GameCard } from "./GameCard";

interface GameListProps {
  games: Game[];
  onReset: () => void;
  rankOffset?: number;
}

export function GameList({ games, onReset, rankOffset = 0 }: GameListProps) {
  if (games.length === 0) {
    return <EmptyState onReset={onReset} />;
  }

  return (
    <section aria-label="Curated games">
      <div className="flex flex-col gap-4">
        {games.map((game, index) => (
          <GameCard key={game.id} game={game} rank={rankOffset + index + 1} />
        ))}
      </div>
    </section>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-zinc-500 text-sm">No games match your filters.</p>
      <p className="text-zinc-700 text-xs mt-1 mb-5">
        Try lowering the thresholds to see more results.
      </p>
      <button
        onClick={onReset}
        className="text-amber-400 text-xs hover:text-amber-300 transition-colors"
      >
        Reset filters →
      </button>
    </div>
  );
}
