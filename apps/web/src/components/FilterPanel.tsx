"use client";

import { DIMENSION_LABELS, type ScoreDimension } from "@/lib/types";
import {
  DEFAULT_FILTERS,
  SCORE_DIMENSIONS,
  type Filters,
  type TimeControl,
} from "@/lib/filters";
import type { PlayerEntry } from "@/lib/topPlayers";
import { PlayerChip } from "./PlayerChip";

interface FilterPanelProps {
  filters: Filters;
  onUpdate: (updates: Partial<Filters>) => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
  topPlayers: PlayerEntry[];
}

const TIME_CONTROLS: { value: TimeControl; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "Bullet", label: "Bullet" },
  { value: "Blitz", label: "Blitz" },
  { value: "Rapid", label: "Rapid" },
];

export function FilterPanel({
  filters,
  onUpdate,
  onReset,
  isOpen,
  onClose,
  topPlayers,
}: FilterPanelProps) {
  const togglePlayer = (name: string) => {
    const current = filters.players;
    const next = current.includes(name)
      ? current.filter((p) => p !== name)
      : [...current, name];
    onUpdate({ players: next });
  };

  return (
    <>
      {/* Scrim mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 overflow-y-auto
          lg:static lg:h-auto lg:z-auto lg:block
          transition-transform duration-200 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          width: "280px",
          background: "var(--panel)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <div className="p-4 flex flex-col gap-0">
          {/* Header de la sidebar */}
          <div
            className="flex items-center justify-between mb-4 sticky top-0 py-1"
            style={{ background: "var(--panel)", zIndex: 1 }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--text-dim)" }}>⫶</span>
              <span
                className="section-label"
                style={{ color: "var(--text-muted)" }}
              >
                Filtres
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onReset}
                className="font-mono text-[11px] transition-colors"
                style={{ color: "var(--text-dim)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-dim)";
                }}
              >
                Réinitialiser
              </button>
              <button
                onClick={onClose}
                className="lg:hidden w-6 h-6 flex items-center justify-center rounded font-mono text-[16px] transition-colors"
                style={{ color: "var(--text-dim)" }}
                aria-label="Fermer les filtres"
              >
                ×
              </button>
            </div>
          </div>

          {/* Seuils par dimension */}
          <section
            className="py-4"
            style={{ borderTop: "1px dashed var(--border)" }}
          >
            <div className="section-label mb-3">Seuils par dimension</div>
            <div className="flex flex-col gap-3">
              {SCORE_DIMENSIONS.map((dim) => (
                <DimSlider
                  key={dim}
                  dim={dim}
                  label={DIMENSION_LABELS[dim]}
                  value={filters[dim]}
                  onChange={(v) => onUpdate({ [dim]: v })}
                />
              ))}
            </div>
          </section>

          {/* Cadence */}
          <section
            className="py-4"
            style={{ borderTop: "1px dashed var(--border)" }}
          >
            <div className="section-label mb-3">Cadence</div>
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              {TIME_CONTROLS.map((tc, i) => (
                <button
                  key={tc.value}
                  onClick={() => onUpdate({ timeControl: tc.value })}
                  className="flex-1 py-1.5 font-mono text-[11px] transition-colors"
                  style={{
                    background:
                      filters.timeControl === tc.value
                        ? "var(--accent-soft)"
                        : "transparent",
                    color:
                      filters.timeControl === tc.value
                        ? "var(--accent)"
                        : "var(--text-dim)",
                    borderLeft: i > 0 ? "1px solid var(--border)" : "none",
                    borderRight: "none",
                  }}
                >
                  {tc.label}
                </button>
              ))}
            </div>
          </section>

          {/* Joueurs */}
          <section
            className="py-4"
            style={{ borderTop: "1px dashed var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="section-label">Joueurs</span>
              {filters.players.length > 0 && (
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full font-mono text-[10px] font-semibold"
                  style={{ background: "var(--accent)", color: "var(--bg)" }}
                >
                  {filters.players.length}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {topPlayers.map((p) => (
                <PlayerChip
                  key={p.username}
                  name={p.username}
                  rating={p.maxRating}
                  active={filters.players.includes(p.username)}
                  onClick={() => togglePlayer(p.username)}
                />
              ))}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}

interface DimSliderProps {
  dim: ScoreDimension;
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function DimSlider({ dim, label, value, onChange }: DimSliderProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={`slider-${dim}`}
        className="w-[100px] shrink-0 font-mono text-[11px] truncate cursor-pointer"
        style={{ color: "var(--text-muted)" }}
        title={label}
      >
        {label}
      </label>
      <input
        id={`slider-${dim}`}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="flex-1 dim-slider"
        style={{ "--pct": `${value}%` } as React.CSSProperties}
        aria-label={`Seuil minimum ${label}`}
      />
      <span
        className="w-6 text-right font-mono text-[11px] tabular-nums shrink-0"
        style={{ color: value === 0 ? "var(--text-dim)" : "var(--accent)" }}
      >
        {value === 0 ? "—" : value}
      </span>
    </div>
  );
}

export { DEFAULT_FILTERS };
