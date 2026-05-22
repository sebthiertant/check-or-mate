// Main check-or-mate app
const { useState, useEffect, useMemo, useRef } = React;

function App() {
  // tweaks
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // filter state — each slider is a minimum threshold (0 = ignored)
  const [filters, setFilters] = useState({
    sacrifice: 0, drama: 0, brilliancy: 0, clock: 0, endgame: 0, upset: 0, rarity: 0,
  });
  const [activePlayers, setActivePlayers] = useState(new Set());
  const [sort, setSort] = useState("score");
  const [timeControl, setTimeControl] = useState("all");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile drawer
  const [selectedId, setSelectedId] = useState(window.GAMES_DATA[0].id);
  const [moveIdx, setMoveIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [detailOpenMobile, setDetailOpenMobile] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // when selection changes, reset move index
  useEffect(() => { setMoveIdx(0); }, [selectedId]);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const togglePlayer = (name) => setActivePlayers(prev => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });
  const resetFilters = () => {
    setFilters({ sacrifice: 0, drama: 0, brilliancy: 0, clock: 0, endgame: 0, upset: 0, rarity: 0 });
    setActivePlayers(new Set());
    setTimeControl("all");
    setSearch("");
  };

  // filter + sort
  const games = useMemo(() => {
    let g = window.GAMES_DATA.filter(game => {
      for (const k of Object.keys(filters)) {
        if (filters[k] > 0 && (game.dims[k] || 0) < filters[k]) return false;
      }
      if (activePlayers.size > 0) {
        if (!activePlayers.has(game.white.name) && !activePlayers.has(game.black.name)) return false;
      }
      if (timeControl !== "all" && game.timeControl !== timeControl) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${game.white.name} ${game.black.name} ${game.eco} ${game.opening}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (sort === "score") g = [...g].sort((a,b) => b.score - a.score);
    else if (sort === "date") g = [...g].sort((a,b) => b.rank - a.rank);
    else g = [...g].sort((a,b) => (b.dims[sort] || 0) - (a.dims[sort] || 0));
    return g;
  }, [filters, activePlayers, sort, timeControl, search]);

  const selected = useMemo(
    () => window.GAMES_DATA.find(g => g.id === selectedId) || window.GAMES_DATA[0],
    [selectedId]
  );

  // keyboard nav for board
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowLeft")  setMoveIdx(i => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setMoveIdx(i => Math.min(SAMPLE_POSITIONS.length - 1, i + 1));
      if (e.key === "Home")  setMoveIdx(0);
      if (e.key === "End")   setMoveIdx(SAMPLE_POSITIONS.length - 1);
      if (e.key === "f" || e.key === "F") setFlipped(v => !v);
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // when a game is selected on mobile, open the detail sheet
  const onSelectGame = (id) => {
    setSelectedId(id);
    if (window.matchMedia("(max-width: 1100px)").matches) {
      setDetailOpenMobile(true);
    }
  };

  // toolbar copy link
  const [linkCopied, setLinkCopied] = useState(false);
  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  };

  return (
    <div className={`app ${t.density === "compact" ? "is-compact" : ""}`} data-accent={t.accent}>
      <Header
        gamesShown={games.length}
        totalGames={window.GAMES_DATA.length}
        sort={sort} setSort={setSort}
        timeControl={timeControl} setTimeControl={setTimeControl}
        search={search} setSearch={setSearch}
        onCopyLink={copyLink} linkCopied={linkCopied}
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilterCount={
          Object.values(filters).filter(v => v > 0).length +
          activePlayers.size +
          (timeControl !== "all" ? 1 : 0)
        }
      />

      <div className="main-grid">
        {/* Filters (desktop sidebar / mobile drawer) */}
        <aside className={`filters ${filtersOpen ? "filters-open" : ""}`}>
          <div className="filters-inner">
            <div className="filters-head">
              <div className="filters-title">
                <span className="kbd-ish">⫶</span> Filtres
              </div>
              <div className="filters-head-right">
                <button className="link-btn" onClick={resetFilters}>Réinitialiser</button>
                <button
                  className="icon-btn close-btn"
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Fermer"
                >×</button>
              </div>
            </div>

            <section className="filter-section">
              <div className="section-label">Seuils par dimension</div>
              <div className="filter-list">
                {DIMENSIONS.map(d => (
                  <RangeSlider
                    key={d.key}
                    label={d.label}
                    value={filters[d.key]}
                    onChange={v => setFilter(d.key, v)}
                  />
                ))}
              </div>
            </section>

            <section className="filter-section">
              <div className="section-label">Cadence</div>
              <div className="seg-control">
                {["all","Bullet","Blitz","Rapid"].map(tc => (
                  <button
                    key={tc}
                    className={`seg ${timeControl === tc ? "seg-on" : ""}`}
                    onClick={() => setTimeControl(tc)}
                  >{tc === "all" ? "Toutes" : tc}</button>
                ))}
              </div>
            </section>

            <section className="filter-section">
              <div className="section-label">
                Joueurs
                {activePlayers.size > 0 && <span className="count-pill">{activePlayers.size}</span>}
              </div>
              <div className="chips">
                {window.PLAYERS.map(p => (
                  <PlayerChip
                    key={p.name}
                    player={p}
                    active={activePlayers.has(p.name)}
                    onClick={() => togglePlayer(p.name)}
                  />
                ))}
              </div>
            </section>
          </div>
        </aside>
        <div className={`scrim ${filtersOpen ? "scrim-on" : ""}`} onClick={() => setFiltersOpen(false)}></div>

        {/* Game list */}
        <main className="game-list">
          <div className="list-meta">
            <span className="list-count">
              <strong>{games.length}</strong> {games.length > 1 ? "parties" : "partie"}
            </span>
            {games.length !== window.GAMES_DATA.length && (
              <button className="link-btn" onClick={resetFilters}>Tout afficher</button>
            )}
          </div>
          {games.length === 0 ? (
            <div className="empty">
              <div className="empty-glyph">∅</div>
              <div>Aucune partie ne passe ces filtres.</div>
              <button className="ghost-btn" onClick={resetFilters}>Réinitialiser</button>
            </div>
          ) : (
            <div className="cards">
              {games.map((g, i) => (
                <GameCard
                  key={g.id}
                  game={g}
                  index={i + 1}
                  selected={g.id === selectedId}
                  onClick={() => onSelectGame(g.id)}
                  scoreViz={t.scoreViz}
                />
              ))}
            </div>
          )}
        </main>

        {/* Detail panel */}
        <aside className={`detail ${detailOpenMobile ? "detail-open" : ""}`}>
          <DetailPanel
            game={selected}
            moveIdx={moveIdx} setMoveIdx={setMoveIdx}
            flipped={flipped} setFlipped={setFlipped}
            onClose={() => setDetailOpenMobile(false)}
            onOpenFullscreen={() => setFullscreen(true)}
            scoreViz={t.scoreViz}
          />
        </aside>
      </div>

      {fullscreen && (
        <FullscreenView
          game={selected}
          moveIdx={moveIdx} setMoveIdx={setMoveIdx}
          flipped={flipped} setFlipped={setFlipped}
          onClose={() => setFullscreen(false)}
          scoreViz={t.scoreViz}
        />
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Accent">
          <TweakColor
            value={t.accent}
            onChange={v => setTweak("accent", v)}
            options={["#f5a524", "#e8e6e1", "#7dd3a8", "#c4a47c", "#e85d5d"]}
            label="Couleur"
          />
        </TweakSection>
        <TweakSection label="Visualisation">
          <TweakRadio
            value={t.scoreViz}
            onChange={v => setTweak("scoreViz", v)}
            options={[
              { value: "bars",   label: "Barres" },
              { value: "matrix", label: "Matrice" },
              { value: "stack",  label: "Empilé" },
            ]}
            label="Score viz"
          />
          <TweakRadio
            value={t.density}
            onChange={v => setTweak("density", v)}
            options={[
              { value: "cozy",    label: "Aéré" },
              { value: "compact", label: "Compact" },
            ]}
            label="Densité"
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────────
function Header({
  gamesShown, totalGames, sort, setSort, timeControl, setTimeControl,
  search, setSearch, onCopyLink, linkCopied,
  onOpenFilters, activeFilterCount,
}) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <svg className="brand-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 21h14v-2H5v2zm2-4h10l-1-4h-8l-1 4zm5-15a3 3 0 00-3 3v1.2c-.6.3-1 .9-1 1.6v.6c0 1 .5 2 1.4 2.6l-.4 1.5h6l-.4-1.5c.9-.6 1.4-1.6 1.4-2.6v-.6c0-.7-.4-1.3-1-1.6V5a3 3 0 00-3-3z" fill="currentColor"/>
          </svg>
          <span className="brand-name">check-or-mate</span>
        </div>

        <div className="header-search">
          <span className="search-glyph">⌕</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Joueur, ouverture, ECO…"
            className="search-input"
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}>×</button>
          )}
        </div>

        <div className="header-tools">
          <button className="tool-btn mobile-only" onClick={onOpenFilters}>
            <span className="tool-glyph">⫶</span>
            Filtres
            {activeFilterCount > 0 && <span className="count-pill">{activeFilterCount}</span>}
          </button>
          <div className="select-wrap">
            <span className="select-label">Tri</span>
            <select value={sort} onChange={e => setSort(e.target.value)} className="select">
              <option value="score">Score global</option>
              <option value="date">Plus récentes</option>
              {DIMENSIONS.map(d => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </div>
          <button className="tool-btn" onClick={onCopyLink}>
            <span className="tool-glyph">{linkCopied ? "✓" : "⎘"}</span>
            <span>{linkCopied ? "Copié" : "Copier le lien"}</span>
          </button>
        </div>
      </div>

      <div className="header-sub">
        <span><strong>{gamesShown}</strong>/{totalGames} parties</span>
        <span className="dot-sep">·</span>
        <span><strong>7</strong> dimensions</span>
        <span className="dot-sep">·</span>
        <span><code>Stockfish 16</code></span>
        <span className="dot-sep">·</span>
        <span className="sub-tag">Curé automatiquement depuis chess.com</span>
      </div>
    </header>
  );
}

// ─── Game card ──────────────────────────────────────────────────────────────
function GameCard({ game, index, selected, onClick, scoreViz }) {
  // top 3 dims for the card preview
  const topDims = useMemo(() => {
    return [...DIMENSIONS]
      .map(d => ({ ...d, value: game.dims[d.key] || 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }, [game]);

  const resultClass =
    game.result === "1-0" ? "res-w" : game.result === "0-1" ? "res-b" : "res-d";

  return (
    <article
      className={`card ${selected ? "card-on" : ""}`}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter") onClick(); }}
    >
      <div className="card-rank">{String(index).padStart(2, "0")}</div>

      <div className="card-body">
        <div className="card-top">
          <div className="players">
            <div className="player">
              <span className="player-color player-color-w" aria-hidden="true"></span>
              <span className="player-name">{game.white.name}</span>
              <span className="player-rating">{game.white.rating}</span>
            </div>
            <span className="vs">vs</span>
            <div className="player">
              <span className="player-color player-color-b" aria-hidden="true"></span>
              <span className="player-name">{game.black.name}</span>
              <span className="player-rating">{game.black.rating}</span>
            </div>
          </div>
          <div className="card-meta">
            <span className={`result ${resultClass}`}>{game.result}</span>
            <span className="meta-dot">·</span>
            <span>{game.timeControl}</span>
            <span className="meta-dot">·</span>
            <code>{game.eco}</code>
            <span className="meta-dot">·</span>
            <span className="card-date">{game.date}</span>
          </div>
          <div className="card-highlight">{game.highlight}</div>
        </div>

        <div className="card-viz">
          {scoreViz === "bars" && (
            <div className="dimbars">
              {topDims.map(d => (
                <DimBar key={d.key} label={d.label} value={d.value} compact />
              ))}
            </div>
          )}
          {scoreViz === "matrix" && (
            <ScoreMatrix dims={game.dims} dimensions={DIMENSIONS} mini />
          )}
          {scoreViz === "stack" && (
            <div className="stack-wrap">
              <ScoreStack dims={game.dims} dimensions={DIMENSIONS} />
              <div className="stack-legend">
                {DIMENSIONS.map(d => (
                  <span key={d.key} className="stack-leg">
                    <span className="stack-leg-dot" style={{
                      background: `oklch(0.68 0.12 ${DIMENSIONS.indexOf(d) * (360 / DIMENSIONS.length)})`,
                    }}></span>
                    {d.short} <span className="stack-leg-val">{game.dims[d.key]}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card-score">
        <div className="card-score-value">{game.score}</div>
        <div className="card-score-label">score</div>
      </div>
    </article>
  );
}

// ─── Detail panel ───────────────────────────────────────────────────────────
function DetailPanel({ game, moveIdx, setMoveIdx, flipped, setFlipped, onClose, onOpenFullscreen, scoreViz }) {
  const pos = SAMPLE_POSITIONS[Math.min(moveIdx, SAMPLE_POSITIONS.length - 1)];
  const evalNumber = (50 - (moveIdx * 7)).toFixed(2); // fake eval
  return (
    <div className="detail-inner">
      <div className="detail-head">
        <div>
          <div className="detail-eyebrow">Partie sélectionnée</div>
          <div className="detail-matchup">
            <span>{game.white.name}</span>
            <span className="detail-vs">vs</span>
            <span>{game.black.name}</span>
          </div>
          <div className="detail-meta">
            <code>{game.eco}</code> · {game.opening} · {game.timeControl} · {game.date}
          </div>
        </div>
        <div className="detail-head-actions">
          <button
            className="icon-btn"
            onClick={onOpenFullscreen}
            title="Plein écran"
            aria-label="Plein écran"
          >⛶</button>
          <button className="icon-btn close-btn mobile-only" onClick={onClose} aria-label="Fermer">×</button>
        </div>
      </div>

      <div className="board-wrap">
        <ChessBoard position={pos} flipped={flipped} />
        <div className="eval-rail">
          <div
            className="eval-fill"
            style={{ height: `${50 + Math.max(-50, Math.min(50, +evalNumber))}%` }}
          ></div>
          <span className="eval-value">{evalNumber > 0 ? `+${evalNumber}` : evalNumber}</span>
        </div>
      </div>

      <div className="board-controls">
        <div className="move-controls">
          <button className="ctrl" onClick={() => setMoveIdx(0)} title="Début (Home)">⏮</button>
          <button className="ctrl" onClick={() => setMoveIdx(i => Math.max(0, i - 1))} title="Coup précédent (←)">◀</button>
          <span className="move-label">{pos.label}</span>
          <button className="ctrl" onClick={() => setMoveIdx(i => Math.min(SAMPLE_POSITIONS.length - 1, i + 1))} title="Coup suivant (→)">▶</button>
          <button className="ctrl" onClick={() => setMoveIdx(SAMPLE_POSITIONS.length - 1)} title="Fin (End)">⏭</button>
        </div>
        <button className="ctrl flip-btn" onClick={() => setFlipped(f => !f)} title="Retourner l'échiquier (F)">
          ⇅ Retourner
        </button>
      </div>

      <div className="detail-section">
        <div className="section-label-row">
          <span className="section-label">Toutes les dimensions</span>
          <span className="section-score">
            <strong>{game.score}</strong> <span className="muted">/100</span>
          </span>
        </div>
        {scoreViz === "stack" ? (
          <div className="stack-wrap">
            <ScoreStack dims={game.dims} dimensions={DIMENSIONS} />
            <div className="stack-legend">
              {DIMENSIONS.map((d, i) => (
                <span key={d.key} className="stack-leg">
                  <span className="stack-leg-dot" style={{
                    background: `oklch(0.68 0.12 ${i * (360 / DIMENSIONS.length)})`,
                  }}></span>
                  {d.label} <span className="stack-leg-val">{game.dims[d.key]}</span>
                </span>
              ))}
            </div>
          </div>
        ) : scoreViz === "matrix" ? (
          <ScoreMatrix dims={game.dims} dimensions={DIMENSIONS} />
        ) : (
          <div className="dimbars dimbars-full">
            {DIMENSIONS.map(d => (
              <DimBar key={d.key} label={d.label} value={game.dims[d.key] || 0} />
            ))}
          </div>
        )}
      </div>

      <div className="detail-section">
        <div className="section-label">Analyse</div>
        <p className="detail-highlight">{game.highlight}</p>
        <div className="detail-stats">
          <div className="stat"><span className="stat-label">Coups</span><span className="stat-value">{game.moves}</span></div>
          <div className="stat"><span className="stat-label">Résultat</span><span className="stat-value">{game.result}</span></div>
          <div className="stat"><span className="stat-label">Cadence</span><span className="stat-value">{game.timeControl}</span></div>
          <div className="stat"><span className="stat-label">Ouverture</span><span className="stat-value">{game.opening}</span></div>
        </div>
      </div>

      <a className="chesscom-link" href={game.chessComUrl} target="_blank" rel="noopener">
        Voir sur Chess.com <span aria-hidden="true">→</span>
      </a>

      <div className="detail-shortcuts">
        <span><kbd>←</kbd> <kbd>→</kbd> coups</span>
        <span><kbd>F</kbd> retourner</span>
        <span><kbd>⛶</kbd> plein écran</span>
      </div>
    </div>
  );
}

// ─── Fullscreen view ──────────────────────────────────────────────────
function FullscreenView({ game, moveIdx, setMoveIdx, flipped, setFlipped, onClose, scoreViz }) {
  const pos = SAMPLE_POSITIONS[Math.min(moveIdx, SAMPLE_POSITIONS.length - 1)];
  const evalNumber = (50 - (moveIdx * 7)).toFixed(2);
  const movePct = (moveIdx / Math.max(1, SAMPLE_POSITIONS.length - 1)) * 100;

  // lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fs-overlay" role="dialog" aria-modal="true">
      <header className="fs-header">
        <button className="fs-back" onClick={onClose} title="Fermer (Esc)">
          <span aria-hidden="true">←</span>
          <span>Retour à la liste</span>
        </button>
        <div className="fs-title-block">
          <div className="fs-eyebrow">Partie n°{String(game.rank).padStart(2,"0")}</div>
          <div className="fs-matchup">
            <span className="fs-name">{game.white.name}</span>
            <span className="fs-rating">{game.white.rating}</span>
            <span className="fs-vs">vs</span>
            <span className="fs-name">{game.black.name}</span>
            <span className="fs-rating">{game.black.rating}</span>
          </div>
        </div>
        <div className="fs-header-actions">
          <a className="fs-chesscom" href={game.chessComUrl} target="_blank" rel="noopener">
            Chess.com <span aria-hidden="true">↗</span>
          </a>
          <button className="icon-btn close-btn" onClick={onClose} aria-label="Fermer" title="Esc">×</button>
        </div>
      </header>

      <div className="fs-body">
        <section className="fs-board-col">
          <div className="fs-board-wrap">
            <div className="fs-eval-rail">
              <div
                className="fs-eval-fill"
                style={{ height: `${50 + Math.max(-50, Math.min(50, +evalNumber))}%` }}
              ></div>
              <span className="fs-eval-value">{evalNumber > 0 ? `+${evalNumber}` : evalNumber}</span>
            </div>
            <div className="fs-board">
              <ChessBoard position={pos} flipped={flipped} />
            </div>
          </div>

          <div className="fs-controls">
            <div className="fs-progress">
              <div className="fs-progress-fill" style={{ width: `${movePct}%` }}></div>
              <div className="fs-progress-dots">
                {SAMPLE_POSITIONS.map((p, i) => (
                  <button
                    key={i}
                    className={`fs-progress-dot ${i === moveIdx ? "on" : ""} ${i < moveIdx ? "past" : ""}`}
                    onClick={() => setMoveIdx(i)}
                    title={p.label}
                    aria-label={`Aller à ${p.label}`}
                  ></button>
                ))}
              </div>
            </div>
            <div className="fs-controls-row">
              <div className="fs-move-info">
                <span className="fs-move-label">{pos.label}</span>
                <span className="fs-move-counter">{moveIdx + 1} / {SAMPLE_POSITIONS.length}</span>
              </div>
              <div className="fs-move-buttons">
                <button className="fs-ctrl" onClick={() => setMoveIdx(0)} title="Début">⏮</button>
                <button className="fs-ctrl" onClick={() => setMoveIdx(i => Math.max(0, i - 1))} title="Précédent (←)">◀</button>
                <button className="fs-ctrl" onClick={() => setMoveIdx(i => Math.min(SAMPLE_POSITIONS.length - 1, i + 1))} title="Suivant (→)">▶</button>
                <button className="fs-ctrl" onClick={() => setMoveIdx(SAMPLE_POSITIONS.length - 1)} title="Fin">⏭</button>
                <button className="fs-ctrl fs-ctrl-flip" onClick={() => setFlipped(f => !f)} title="Retourner (F)">⇅</button>
              </div>
            </div>
          </div>
        </section>

        <section className="fs-info-col">
          <div className="fs-score-block">
            <div className="fs-score-value">{game.score}</div>
            <div className="fs-score-label">score global<br /><span className="fs-score-sub">curated by machine</span></div>
          </div>

          <div className="fs-section">
            <div className="section-label">Sept dimensions</div>
            {scoreViz === "stack" ? (
              <div className="stack-wrap">
                <ScoreStack dims={game.dims} dimensions={DIMENSIONS} />
                <div className="stack-legend">
                  {DIMENSIONS.map((d, i) => (
                    <span key={d.key} className="stack-leg">
                      <span className="stack-leg-dot" style={{
                        background: `oklch(0.68 0.12 ${i * (360 / DIMENSIONS.length)})`,
                      }}></span>
                      {d.label} <span className="stack-leg-val">{game.dims[d.key]}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : scoreViz === "matrix" ? (
              <ScoreMatrix dims={game.dims} dimensions={DIMENSIONS} />
            ) : (
              <div className="dimbars dimbars-full">
                {DIMENSIONS.map(d => (
                  <DimBar key={d.key} label={d.label} value={game.dims[d.key] || 0} />
                ))}
              </div>
            )}
          </div>

          <div className="fs-section">
            <div className="section-label">Analyse</div>
            <p className="detail-highlight">{game.highlight}</p>
          </div>

          <div className="fs-section">
            <div className="section-label">Données</div>
            <div className="detail-stats">
              <div className="stat"><span className="stat-label">Coups</span><span className="stat-value">{game.moves}</span></div>
              <div className="stat"><span className="stat-label">Résultat</span><span className="stat-value">{game.result}</span></div>
              <div className="stat"><span className="stat-label">Cadence</span><span className="stat-value">{game.timeControl}</span></div>
              <div className="stat"><span className="stat-label">Ouverture</span><span className="stat-value">{game.opening}</span></div>
              <div className="stat"><span className="stat-label">ECO</span><span className="stat-value">{game.eco}</span></div>
              <div className="stat"><span className="stat-label">Date</span><span className="stat-value">{game.date}</span></div>
            </div>
          </div>

          <div className="fs-shortcuts">
            <span><kbd>←</kbd> <kbd>→</kbd> coups</span>
            <span><kbd>F</kbd> retourner</span>
            <span><kbd>Esc</kbd> fermer</span>
          </div>
        </section>
      </div>
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#f5a524",
  "scoreViz": "bars",
  "density": "cozy"
}/*EDITMODE-END*/;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
