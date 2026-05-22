import type { Game } from "@/lib/types";
import { GameCard } from "./GameCard";

interface GameListProps {
  games: Game[];
  onReset: () => void;
  rankOffset?: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  totalFiltered: number;
  totalGames: number;
}

export function GameList({
  games,
  onReset,
  rankOffset = 0,
  selectedId,
  onSelect,
  totalFiltered,
  totalGames,
}: GameListProps) {
  return (
    <section aria-label="Parties sélectionnées" className="flex flex-col min-h-0">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-1 py-2 mb-2 font-mono text-[12px]"
        style={{ color: "var(--text-muted)" }}
      >
        <span>
          <strong style={{ color: "var(--text)" }}>{totalFiltered}</strong>{" "}
          {totalFiltered > 1 ? "parties" : "partie"}
        </span>
        {totalFiltered !== totalGames && (
          <button
            onClick={onReset}
            className="transition-colors"
            style={{ color: "var(--text-dim)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-dim)"; }}
          >
            Tout afficher
          </button>
        )}
      </div>

      {games.length === 0 ? (
        <EmptyState onReset={onReset} />
      ) : (
        <div className="flex flex-col gap-2">
          {games.map((game, index) => (
            <GameCard
              key={game.id}
              game={game}
              rank={rankOffset + index + 1}
              selected={game.id === selectedId}
              onClick={() => onSelect(game.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="font-mono text-[48px]" style={{ color: "var(--text-dim)" }}>∅</div>
      <p className="font-mono text-[13px]" style={{ color: "var(--text-muted)" }}>
        Aucune partie ne passe ces filtres.
      </p>
      <button
        onClick={onReset}
        className="px-4 py-2 rounded-lg font-mono text-[12px] transition-colors"
        style={{
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
          background: "transparent",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--border-strong)";
          e.currentTarget.style.color = "var(--text)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.color = "var(--text-muted)";
        }}
      >
        Réinitialiser
      </button>
    </div>
  );
}
