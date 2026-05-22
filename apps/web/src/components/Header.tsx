"use client";

interface HeaderProps {
  gamesShown: number;
  totalGames: number;
  sort: string;
  onSortChange: (sort: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
  linkCopied: boolean;
  onCopyLink: () => void;
}

const SORT_OPTIONS = [
  { value: "overall",         label: "Score global" },
  { value: "sacrifice",       label: "Sacrifice" },
  { value: "eval_swing",      label: "Drama" },
  { value: "brilliancy",      label: "Brilliancy" },
  { value: "time_pressure",   label: "Clock pressure" },
  { value: "endgame_quality", label: "Endgame" },
  { value: "rating_upset",    label: "Upset" },
  { value: "opening_rarity",  label: "Rarity" },
];

export function Header({
  gamesShown,
  totalGames,
  sort,
  onSortChange,
  search,
  onSearchChange,
  onOpenFilters,
  activeFilterCount,
  linkCopied,
  onCopyLink,
}: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "rgba(11,10,9,0.9)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--border)",
      }}
    >
      <div className="max-w-[1600px] mx-auto px-4 py-3">
        {/* Ligne principale */}
        <div className="flex items-center gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              style={{ color: "var(--accent)" }}
            >
              <path
                d="M5 21h14v-2H5v2zm2-4h10l-1-4h-8l-1 4zm5-15a3 3 0 00-3 3v1.2c-.6.3-1 .9-1 1.6v.6c0 1 .5 2 1.4 2.6l-.4 1.5h6l-.4-1.5c.9-.6 1.4-1.6 1.4-2.6v-.6c0-.7-.4-1.3-1-1.6V5a3 3 0 00-3-3z"
                fill="currentColor"
              />
            </svg>
            <span
              className="font-mono text-[15px] font-semibold"
              style={{ color: "var(--text)" }}
            >
              check-or-mate
            </span>
          </div>

          {/* Search */}
          <div
            className="relative flex-1"
            style={{ maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}
          >
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none select-none"
              style={{ color: "var(--text-dim)" }}
            >
              ⌕
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Joueur, ouverture, ECO…"
              className="w-full pl-8 pr-8 py-1.5 rounded-lg font-mono text-[12px] bg-transparent transition-colors"
              style={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                outline: "none",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-line)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
            {search && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[14px] leading-none transition-colors"
                style={{ color: "var(--text-dim)" }}
                aria-label="Effacer la recherche"
              >
                ×
              </button>
            )}
          </div>

          {/* Tools */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Filtres — mobile only */}
            <button
              className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[12px] transition-colors"
              style={{
                background: activeFilterCount > 0 ? "var(--accent-soft)" : "var(--panel)",
                border: `1px solid ${activeFilterCount > 0 ? "var(--accent-line)" : "var(--border)"}`,
                color: activeFilterCount > 0 ? "var(--accent)" : "var(--text-muted)",
              }}
              onClick={onOpenFilters}
            >
              <span>⫶</span>
              <span className="max-[480px]:hidden">Filtres</span>
              {activeFilterCount > 0 && (
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full font-mono text-[10px] font-semibold"
                  style={{ background: "var(--accent)", color: "var(--bg)" }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] hidden sm:block" style={{ color: "var(--text-dim)" }}>
                Tri
              </span>
              <select
                value={sort}
                onChange={(e) => onSortChange(e.target.value)}
                className="font-mono text-[12px] px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  outline: "none",
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Copy link */}
            <button
              onClick={onCopyLink}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[12px] transition-colors"
              style={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                color: linkCopied ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              <span>{linkCopied ? "✓" : "⎘"}</span>
              <span className="hidden sm:inline">{linkCopied ? "Copié" : "Copier le lien"}</span>
            </button>
          </div>
        </div>

        {/* Sous-ligne */}
        <div
          className="flex items-center gap-1.5 mt-2 font-mono text-[11px]"
          style={{ color: "var(--text-dim)" }}
        >
          <strong style={{ color: "var(--text-muted)" }}>{gamesShown}</strong>
          <span>/ {totalGames} parties</span>
          <span className="mx-1">·</span>
          <strong style={{ color: "var(--text-muted)" }}>7</strong>
          <span>dimensions</span>
          <span className="mx-1">·</span>
          <code className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>Stockfish 16</code>
          <span className="mx-1">·</span>
          <em style={{ color: "var(--text-dim)" }}>Curé automatiquement depuis chess.com</em>
        </div>
      </div>
    </header>
  );
}
