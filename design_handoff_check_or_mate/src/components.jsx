// Core UI components for check-or-mate

const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ─── Chess board ────────────────────────────────────────────────────────────
// Minimal FEN renderer — enough for the prototype. Real version pipes in PGN.
const PIECE_GLYPHS = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
// A handful of plausible positions to navigate between
const SAMPLE_POSITIONS = [
  { fen: START_FEN, label: "Position initiale", move: 0 },
  { fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR", label: "1...c5", move: 2 },
  { fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R", label: "2.Cf3", move: 3 },
  { fen: "r1bqkbnr/pp1ppppp/2n5/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R", label: "2...Cc6", move: 4 },
  { fen: "r1bqkbnr/pp1ppppp/2n5/2p5/3PP3/5N2/PPP2PPP/RNBQKB1R", label: "3.d4", move: 5 },
  { fen: "r1bqkbnr/pp1ppppp/2n5/8/3pP3/5N2/PPP2PPP/RNBQKB1R", label: "3...cxd4", move: 6 },
  { fen: "r1bqkbnr/pp1ppppp/2n5/8/3NP3/8/PPP2PPP/RNBQKB1R", label: "4.Cxd4", move: 7 },
];

function parseFen(fen) {
  const rows = fen.split(" ")[0].split("/");
  return rows.map(row => {
    const cells = [];
    for (const ch of row) {
      if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) cells.push(null);
      else cells.push(ch);
    }
    return cells;
  });
}

function ChessBoard({ position, flipped = false, lastMove = null }) {
  const board = parseFen(position.fen);
  const ranks = flipped ? [...board].reverse() : board;
  const files = flipped ? ["h","g","f","e","d","c","b","a"] : ["a","b","c","d","e","f","g","h"];
  return (
    <div className="board">
      {ranks.map((row, ri) => {
        const cells = flipped ? [...row].reverse() : row;
        const rankNum = flipped ? ri + 1 : 8 - ri;
        return cells.map((piece, ci) => {
          const fileLabel = files[ci];
          const isDark = (ri + ci) % 2 === 1;
          return (
            <div key={`${ri}-${ci}`} className={`sq ${isDark ? "sq-d" : "sq-l"}`}>
              {ci === 0 && <span className="coord coord-rank">{rankNum}</span>}
              {ri === 7 && <span className="coord coord-file">{fileLabel}</span>}
              {piece && (
                <span className={`piece ${piece === piece.toUpperCase() ? "piece-w" : "piece-b"}`}>
                  {PIECE_GLYPHS[piece]}
                </span>
              )}
            </div>
          );
        });
      })}
    </div>
  );
}

// ─── Score bar (for individual dimensions) ─────────────────────────────────
function DimBar({ label, value, color = "var(--accent)", compact = false }) {
  return (
    <div className={`dimbar ${compact ? "dimbar-compact" : ""}`}>
      <span className="dimbar-label">{label}</span>
      <div className="dimbar-track">
        <div className="dimbar-fill" style={{ width: `${value}%`, background: color }}></div>
      </div>
      <span className="dimbar-value">{value}</span>
    </div>
  );
}

// ─── Score viz: dot-matrix view of the 7 dimensions ────────────────────────
function ScoreMatrix({ dims, dimensions, mini = false }) {
  return (
    <div className={`matrix ${mini ? "matrix-mini" : ""}`}>
      {dimensions.map(d => {
        const v = dims[d.key] || 0;
        const filled = Math.round(v / 10);
        return (
          <div key={d.key} className="matrix-row">
            <span className="matrix-label">{d.short}</span>
            <div className="matrix-dots">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className={`dot ${i < filled ? "dot-on" : ""}`}></span>
              ))}
            </div>
            <span className="matrix-value">{v}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Sparkline-style stacked score (single horizontal bar split by dim) ────
function ScoreStack({ dims, dimensions }) {
  const total = dimensions.reduce((s, d) => s + (dims[d.key] || 0), 0) || 1;
  return (
    <div className="stack">
      {dimensions.map((d, i) => {
        const v = dims[d.key] || 0;
        const pct = (v / total) * 100;
        const hue = i * (360 / dimensions.length);
        return (
          <div
            key={d.key}
            className="stack-seg"
            style={{ width: `${pct}%`, background: `oklch(0.68 0.12 ${hue})` }}
            title={`${d.label}: ${v}`}
          ></div>
        );
      })}
    </div>
  );
}

// ─── Filter slider ─────────────────────────────────────────────────────────
function RangeSlider({ label, value, onChange }) {
  return (
    <div className="filter-row">
      <label className="filter-label">{label}</label>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={e => onChange(+e.target.value)}
        className="slider"
        style={{ "--pct": `${value}%` }}
      />
      <span className="filter-value">{value === 0 ? "—" : value}</span>
    </div>
  );
}

// ─── Player chip ───────────────────────────────────────────────────────────
function PlayerChip({ player, active, onClick }) {
  return (
    <button
      className={`chip ${active ? "chip-on" : ""}`}
      onClick={onClick}
    >
      <span className="chip-name">{player.name}</span>
      <span className="chip-rating">{player.rating}</span>
    </button>
  );
}

// Export everything to window so sibling babel files can use them.
Object.assign(window, {
  ChessBoard, DimBar, ScoreMatrix, ScoreStack, RangeSlider, PlayerChip,
  SAMPLE_POSITIONS, parseFen, PIECE_GLYPHS,
});
