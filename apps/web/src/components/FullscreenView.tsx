"use client";

import { useEffect, useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import type { Move } from "chess.js";
import type { Game, ScoreDimension } from "@/lib/types";
import { DIMENSION_LABELS } from "@/lib/types";
import { SCORE_DIMENSIONS } from "@/lib/filters";
import { DimBar } from "./DimBar";
import { cpToPercent, formatCp, formatDate } from "@/lib/utils";

interface FullscreenViewProps {
  game: Game;
  moveIdx: number;
  onMoveIdx: (idx: number) => void;
  flipped: boolean;
  onFlip: () => void;
  onClose: () => void;
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

export function FullscreenView({
  game,
  moveIdx,
  onMoveIdx,
  flipped,
  onFlip,
  onClose,
}: FullscreenViewProps) {
  const moves = useMemo(() => parseMoves(game.pgn ?? ""), [game.pgn]);
  const totalMoves = moves.length;
  const clamped = Math.min(moveIdx, totalMoves);
  const position = useMemo(() => positionAt(moves, clamped), [moves, clamped]);
  const label = moveLabel(moves, clamped);

  // Per-move Stockfish evaluation (centipawns, white POV).
  const currentCp: number | null =
    game.evaluations && game.evaluations.length > 0
      ? clamped === 0
        ? 0
        : (game.evaluations[clamped - 1] ?? null)
      : null;
  const evalFill = currentCp !== null ? cpToPercent(currentCp) : 50;
  const evalLabel = currentCp !== null ? formatCp(currentCp) : null;

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-fs-enter"
      style={{ background: "var(--bg)" }}
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <header
        className="flex items-center shrink-0 px-6 py-3"
        style={{
          background: "var(--panel)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Gauche : retour */}
        <button
          onClick={onClose}
          className="flex items-center gap-2 font-mono text-[12px] transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <span>←</span>
          <span>Retour à la liste</span>
        </button>

        {/* Centre : titre */}
        <div className="flex-1 flex flex-col items-center gap-0.5">
          <div className="eyebrow">
            Partie n°{String(game.scores.overall).padStart(2, "0")}
          </div>
          <div
            className="font-mono font-semibold text-[18px] flex items-baseline gap-2"
            style={{ color: "var(--text)" }}
          >
            <span>{game.white}</span>
            <span className="text-[12px]" style={{ color: "var(--text-dim)" }}>
              {game.white_rating}
            </span>
            <span className="text-[14px]" style={{ color: "var(--text-dim)" }}>
              vs
            </span>
            <span>{game.black}</span>
            <span className="text-[12px]" style={{ color: "var(--text-dim)" }}>
              {game.black_rating}
            </span>
          </div>
        </div>

        {/* Droite : actions */}
        <div className="flex items-center gap-2">
          <a
            href={`https://www.chess.com/game/live/${game.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-mono text-[12px] transition-colors"
            style={{
              background: "var(--panel-3)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            Chess.com ↗
          </a>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg font-mono text-[18px] transition-colors"
            style={{
              background: "var(--panel-3)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
            title="Fermer (Esc)"
            aria-label="Fermer le plein écran"
          >
            ×
          </button>
        </div>
      </header>

      {/* Body : grille board | infos */}
      <div
        className="flex flex-1 min-h-0"
        style={{ gridTemplateColumns: "1fr 420px" }}
      >
        {/* Colonne board */}
        <section
          className="flex flex-col flex-1 items-center justify-center p-6 gap-4"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(245,165,36,0.04) 0%, transparent 70%)",
          }}
        >
          <div
            className="flex gap-3 items-stretch"
            style={{ maxWidth: "min(75vh, 720px)", width: "100%" }}
          >
            {/* Eval rail */}
            <div
              className="eval-rail relative"
              style={{
                width: "14px",
                borderRadius: "var(--r-sm)",
                background: "var(--border)",
              }}
            >
              <div className="eval-fill" style={{ height: `${evalFill}%` }} />
              {evalLabel !== null && (
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
              )}
            </div>

            {/* Board */}
            <div className="flex-1 min-w-0">
              <Chessboard
                id={`fs-${game.id}`}
                position={position}
                boardOrientation={flipped ? "black" : "white"}
                arePiecesDraggable={false}
                customBoardStyle={{
                  borderRadius: "8px",
                  boxShadow:
                    "0 30px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.4)",
                }}
                customDarkSquareStyle={{ backgroundColor: "var(--sq-dark)" }}
                customLightSquareStyle={{ backgroundColor: "var(--sq-light)" }}
              />
            </div>
          </div>

          {/* Progress bar */}
          {totalMoves > 0 && (
            <div
              className="relative h-2 rounded-full overflow-hidden w-full"
              style={{
                maxWidth: "min(75vh, 720px)",
                background: "var(--panel-3)",
              }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-150"
                style={{
                  width: `${(clamped / Math.max(1, totalMoves)) * 100}%`,
                  background: "var(--accent)",
                }}
              />
              {/* Dots */}
              <div className="absolute inset-0 flex">
                {moves.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => onMoveIdx(i + 1)}
                    className="flex-1 relative flex items-center justify-center group"
                    aria-label={`Coup ${i + 1}`}
                  >
                    <span
                      className="absolute w-1.5 h-1.5 rounded-full transition-all duration-100"
                      style={{
                        background:
                          i + 1 <= clamped ? "var(--accent)" : "var(--panel-2)",
                        transform:
                          i + 1 === clamped ? "scale(1.5)" : "scale(1)",
                        boxShadow:
                          i + 1 === clamped
                            ? "0 0 0 3px var(--accent-soft)"
                            : "none",
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contrôles */}
          <div
            className="flex items-center justify-between w-full"
            style={{ maxWidth: "min(75vh, 720px)" }}
          >
            <div
              className="flex items-center gap-2 font-mono text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              <span>{label}</span>
              {totalMoves > 0 && (
                <span style={{ color: "var(--text-dim)" }}>
                  {clamped} / {totalMoves}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <FsCtrl
                onClick={() => onMoveIdx(0)}
                title="Début"
                disabled={clamped === 0}
              >
                ⏮
              </FsCtrl>
              <FsCtrl
                onClick={() => onMoveIdx(Math.max(0, clamped - 1))}
                title="Précédent (←)"
                disabled={clamped === 0}
              >
                ◀
              </FsCtrl>
              <FsCtrl
                onClick={() => onMoveIdx(Math.min(totalMoves, clamped + 1))}
                title="Suivant (→)"
                disabled={clamped === totalMoves}
              >
                ▶
              </FsCtrl>
              <FsCtrl
                onClick={() => onMoveIdx(totalMoves)}
                title="Fin"
                disabled={clamped === totalMoves}
              >
                ⏭
              </FsCtrl>
              <div
                className="w-px h-5 mx-1"
                style={{ background: "var(--border)" }}
              />
              <FsCtrl onClick={onFlip} title="Retourner (F)">
                ⇅
              </FsCtrl>
            </div>
          </div>
        </section>

        {/* Colonne infos */}
        <section
          className="flex flex-col overflow-y-auto p-6 gap-6 shrink-0"
          style={{
            width: "420px",
            background: "var(--panel)",
            borderLeft: "1px solid var(--border)",
          }}
        >
          {/* Score block */}
          <div className="flex flex-col gap-1">
            <div
              className="font-mono font-semibold leading-none"
              style={{ fontSize: "72px", color: "var(--accent)" }}
            >
              {game.scores.overall}
            </div>
            <div
              className="font-mono text-[11px]"
              style={{ color: "var(--text-dim)" }}
            >
              score global
              <br />
              <em>curated by machine</em>
            </div>
          </div>

          {/* Sept dimensions */}
          <div>
            <div className="section-label mb-3">Sept dimensions</div>
            <div className="flex flex-col gap-2">
              {SCORE_DIMENSIONS.map((dim) => (
                <DimBar
                  key={dim}
                  label={DIMENSION_LABELS[dim as ScoreDimension]}
                  value={game.scores[dim] ?? 0}
                />
              ))}
            </div>
          </div>

          {/* Données */}
          <div>
            <div className="section-label mb-3">Données</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                { label: "Résultat", value: game.result },
                { label: "Cadence", value: TIME_CLASS_LABEL[game.time_class] },
                { label: "Ouverture", value: game.opening_name },
                { label: "ECO", value: game.eco },
                { label: "Date", value: formatDate(game.date) },
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
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Raccourcis */}
          <div
            className="flex flex-col gap-1.5 mt-auto font-mono text-[10px]"
            style={{ color: "var(--text-dim)" }}
          >
            <div className="section-label mb-1">Raccourcis</div>
            <span>
              <Kbd>←</Kbd> <Kbd>→</Kbd> coups
            </span>
            <span>
              <Kbd>F</Kbd> retourner
            </span>
            <span>
              <Kbd>Esc</Kbd> fermer
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

function FsCtrl({
  onClick,
  title,
  disabled,
  children,
}: {
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="w-8 h-8 flex items-center justify-center rounded-lg font-mono text-[14px] transition-colors disabled:opacity-30"
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
