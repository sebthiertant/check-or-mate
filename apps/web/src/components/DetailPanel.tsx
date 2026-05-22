"use client";

import { useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import type { Move } from "chess.js";
import type { Game, ScoreDimension } from "@/lib/types";
import { DIMENSION_LABELS } from "@/lib/types";
import { SCORE_DIMENSIONS } from "@/lib/filters";
import { DimBar } from "./DimBar";
import { cpToPercent, formatCp, formatDate } from "@/lib/utils";

interface DetailPanelProps {
  game: Game | null;
  moveIdx: number;
  onMoveIdx: (idx: number) => void;
  flipped: boolean;
  onFlip: () => void;
  onClose: () => void;
  onOpenFullscreen: () => void;
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
  for (let i = 0; i < index; i++) chess.move(moves[i].san);
  return chess.fen();
}

function moveLabel(moves: Move[], index: number): string {
  if (index === 0) return "Position initiale";
  const move = moves[index - 1];
  const number = Math.ceil(index / 2);
  const dot = index % 2 === 1 ? "." : "…";
  return `${number}${dot} ${move.san}`;
}

const TIME_CLASS_LABEL: Record<Game["time_class"], string> = {
  bullet: "Bullet",
  blitz: "Blitz",
  rapid: "Rapid",
  classical: "Classical",
};

export function DetailPanel({
  game,
  moveIdx,
  onMoveIdx,
  flipped,
  onFlip,
  onClose,
  onOpenFullscreen,
}: DetailPanelProps) {
  const moves = useMemo(() => parseMoves(game?.pgn ?? ""), [game?.pgn]);
  const totalMoves = moves.length;
  const position = useMemo(() => positionAt(moves, moveIdx), [moves, moveIdx]);
  const label = moveLabel(moves, moveIdx);

  const clampedIdx = Math.min(moveIdx, totalMoves);

  // Per-move Stockfish evaluation (centipawns, white POV).
  // moveIdx 0 = initial position (eval ≈ 0), moveIdx n = after n half-moves.
  const currentCp: number | null =
    game?.evaluations && game.evaluations.length > 0
      ? clampedIdx === 0
        ? 0
        : (game.evaluations[clampedIdx - 1] ?? null)
      : null;
  const evalFill = currentCp !== null ? cpToPercent(currentCp) : 50;
  const evalLabel = currentCp !== null ? formatCp(currentCp) : null;

  if (!game) {
    return (
      <aside
        className="flex items-center justify-center"
        style={{
          width: "440px",
          background: "var(--panel)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        <p
          className="font-mono text-[12px]"
          style={{ color: "var(--text-dim)" }}
        >
          Sélectionnez une partie
        </p>
      </aside>
    );
  }

  return (
    <aside
      className="flex flex-col overflow-y-auto"
      style={{
        width: "440px",
        minWidth: "400px",
        background: "var(--panel)",
        borderLeft: "1px solid var(--border)",
      }}
    >
      <div className="flex flex-col gap-0 p-4">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col gap-1">
            <div className="eyebrow">Partie sélectionnée</div>
            <div
              className="font-mono font-semibold text-[16px] flex items-baseline gap-2"
              style={{ color: "var(--text)" }}
            >
              <span>{game.white}</span>
              <span
                className="text-[12px]"
                style={{ color: "var(--text-dim)" }}
              >
                vs
              </span>
              <span>{game.black}</span>
            </div>
            <div
              className="font-mono text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              <code>{game.eco}</code> · {game.opening_name} ·{" "}
              {TIME_CLASS_LABEL[game.time_class]} · {formatDate(game.date)}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <CtrlButton onClick={onOpenFullscreen} title="Plein écran">
              ⛶
            </CtrlButton>
            <CtrlButton onClick={onClose} title="Fermer" className="lg:hidden">
              ×
            </CtrlButton>
          </div>
        </div>

        {/* Board + eval */}
        <div
          className="flex gap-2 mb-3"
          style={{
            boxShadow: "0 12px 36px -16px rgba(0,0,0,0.8)",
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
            padding: "8px",
            background: "var(--panel-2)",
          }}
        >
          <div className="flex-1 min-w-0">
            <Chessboard
              id={`detail-${game.id}`}
              position={position}
              boardOrientation={flipped ? "black" : "white"}
              arePiecesDraggable={false}
              customBoardStyle={{ borderRadius: "6px" }}
              customDarkSquareStyle={{ backgroundColor: "var(--sq-dark)" }}
              customLightSquareStyle={{ backgroundColor: "var(--sq-light)" }}
            />
          </div>
          {evalLabel !== null && (
            <div
              className="eval-rail relative"
              style={{ height: "auto", alignSelf: "stretch", width: "12px" }}
            >
              <div className="eval-fill" style={{ height: `${evalFill}%` }} />
              <span
                className="absolute left-1/2 -translate-x-1/2 font-mono text-[8px] tabular-nums pointer-events-none select-none"
                style={{
                  writingMode: "vertical-rl",
                  top: evalFill > 50 ? "4px" : undefined,
                  bottom: evalFill <= 50 ? "4px" : undefined,
                  color:
                    evalFill > 50 ? "var(--text-dim)" : "var(--text-muted)",
                }}
              >
                {evalLabel}
              </span>
            </div>
          )}
        </div>

        {/* Contrôles */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <CtrlButton
              onClick={() => onMoveIdx(0)}
              title="Début (Home)"
              disabled={clampedIdx === 0}
            >
              ⏮
            </CtrlButton>
            <CtrlButton
              onClick={() => onMoveIdx(Math.max(0, clampedIdx - 1))}
              title="← Précédent"
              disabled={clampedIdx === 0}
            >
              ◀
            </CtrlButton>
            <span
              className="px-2 font-mono text-[11px] tabular-nums"
              style={{
                color: "var(--text-muted)",
                minWidth: "80px",
                textAlign: "center",
              }}
            >
              {label}
            </span>
            <CtrlButton
              onClick={() => onMoveIdx(Math.min(totalMoves, clampedIdx + 1))}
              title="→ Suivant"
              disabled={clampedIdx === totalMoves}
            >
              ▶
            </CtrlButton>
            <CtrlButton
              onClick={() => onMoveIdx(totalMoves)}
              title="Fin (End)"
              disabled={clampedIdx === totalMoves}
            >
              ⏭
            </CtrlButton>
          </div>
          <button
            onClick={onFlip}
            className="flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[11px] transition-colors"
            style={{
              background: "var(--panel-3)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
            title="Retourner l'échiquier (F)"
          >
            ⇅ Retourner
          </button>
        </div>

        {/* Toutes les dimensions */}
        <section
          className="py-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="section-label">Toutes les dimensions</span>
            <span className="font-mono text-[12px]">
              <strong style={{ color: "var(--accent)" }}>
                {game.scores.overall}
              </strong>
              <span style={{ color: "var(--text-dim)" }}> /100</span>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {SCORE_DIMENSIONS.map((dim) => (
              <DimBar
                key={dim}
                label={DIMENSION_LABELS[dim as ScoreDimension]}
                value={game.scores[dim] ?? 0}
              />
            ))}
          </div>
        </section>

        {/* Stats */}
        <section
          className="py-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="section-label mb-3">Données</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              { label: "Coups", value: game.scores.overall },
              { label: "Résultat", value: game.result },
              { label: "Cadence", value: TIME_CLASS_LABEL[game.time_class] },
              { label: "Ouverture", value: game.opening_name },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span
                  className="font-mono text-[10px] uppercase tracking-wider"
                  style={{ color: "var(--text-dim)" }}
                >
                  {label}
                </span>
                <span
                  className="font-mono text-[12px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Lien Chess.com */}
        <a
          href={`https://www.chess.com/game/live/${game.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg font-mono text-[12px] transition-colors mt-2"
          style={{
            background: "var(--panel-3)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
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
          Voir sur Chess.com <span>→</span>
        </a>

        {/* Raccourcis */}
        <div
          className="flex items-center justify-center gap-4 mt-4 font-mono text-[10px]"
          style={{ color: "var(--text-dim)" }}
        >
          <span>
            <Kbd>←</Kbd> <Kbd>→</Kbd> coups
          </span>
          <span>
            <Kbd>F</Kbd> retourner
          </span>
          <span>
            <Kbd>⛶</Kbd> plein écran
          </span>
        </div>
      </div>
    </aside>
  );
}

function CtrlButton({
  onClick,
  title,
  disabled,
  children,
  className = "",
}: {
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`w-7 h-7 flex items-center justify-center rounded font-mono text-[14px] transition-colors disabled:opacity-30 ${className}`}
      style={{
        background: "var(--panel-3)",
        border: "1px solid var(--border)",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex items-center justify-center px-1 rounded font-mono text-[9px]"
      style={{
        background: "var(--panel-3)",
        border: "1px solid var(--border)",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </kbd>
  );
}
