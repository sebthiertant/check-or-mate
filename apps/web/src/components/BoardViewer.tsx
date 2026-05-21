"use client";

import { useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import type { Move } from "chess.js";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

interface BoardViewerProps {
  pgn: string;
  gameId: string;
}

function parseMoves(pgn: string): Move[] {
  if (!pgn) return [];
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    return chess.history({ verbose: true });
  } catch {
    return [];
  }
}

function positionAt(moves: Move[], index: number): string {
  const chess = new Chess();
  for (let i = 0; i < index; i++) {
    chess.move(moves[i].san);
  }
  return chess.fen();
}

function moveLabel(moves: Move[], index: number): string {
  if (index === 0) return "Position initiale";
  const move = moves[index - 1];
  const number = Math.ceil(index / 2);
  const dot = index % 2 === 1 ? "." : "…";
  return `${number}${dot} ${move.san}`;
}

function NavButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="px-2 py-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 transition-colors"
    >
      {children}
    </button>
  );
}

export function BoardViewer({ pgn, gameId }: BoardViewerProps) {
  const [moveIndex, setMoveIndex] = useState(0);
  const moves = useMemo(() => parseMoves(pgn), [pgn]);
  const position = useMemo(
    () => (moves.length > 0 ? positionAt(moves, moveIndex) : STARTING_FEN),
    [moves, moveIndex],
  );

  const chessComUrl = `https://www.chess.com/game/live/${gameId}`;

  if (moves.length === 0) {
    return (
      <div className="pt-3 text-right">
        <a
          href={chessComUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-600 text-xs hover:text-amber-400 transition-colors"
        >
          Voir sur Chess.com →
        </a>
      </div>
    );
  }

  return (
    <div
      className="pt-4 space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      <Chessboard
        id={gameId}
        position={position}
        boardWidth={360}
        arePiecesDraggable={false}
        customBoardStyle={{ borderRadius: "4px" }}
      />
      <div className="flex items-center gap-1">
        <NavButton label="Début" onClick={() => setMoveIndex(0)} disabled={moveIndex === 0}>
          ◀◀
        </NavButton>
        <NavButton
          label="Précédent"
          onClick={() => setMoveIndex((i) => Math.max(0, i - 1))}
          disabled={moveIndex === 0}
        >
          ◀
        </NavButton>
        <span className="flex-1 text-center text-zinc-400 text-sm font-mono">
          {moveLabel(moves, moveIndex)}
        </span>
        <NavButton
          label="Suivant"
          onClick={() => setMoveIndex((i) => Math.min(moves.length, i + 1))}
          disabled={moveIndex === moves.length}
        >
          ▶
        </NavButton>
        <NavButton
          label="Fin"
          onClick={() => setMoveIndex(moves.length)}
          disabled={moveIndex === moves.length}
        >
          ▶▶
        </NavButton>
      </div>
      <div className="text-right">
        <a
          href={chessComUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-600 text-xs hover:text-amber-400 transition-colors"
        >
          Voir sur Chess.com →
        </a>
      </div>
    </div>
  );
}
