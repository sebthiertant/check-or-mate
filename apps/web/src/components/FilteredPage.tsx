"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Chess } from "chess.js";

import type { Game } from "@/lib/types";
import {
  DEFAULT_FILTERS,
  filterGames,
  hasActiveFilters,
  parseFilters,
  serializeFilters,
  sortGames,
  type Filters,
} from "@/lib/filters";
import { getTopPlayers } from "@/lib/topPlayers";
import { useKeyboard } from "@/lib/useKeyboard";

import { Header } from "./Header";
import { FilterPanel } from "./FilterPanel";
import { GameList } from "./GameList";
import { DetailPanel } from "./DetailPanel";
import { FullscreenView } from "./FullscreenView";

const PAGE_SIZE = 20;

interface FilteredPageProps {
  games: Game[];
}

function getMoveCount(pgn: string | undefined): number {
  if (!pgn) return 0;
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    return chess.history().length;
  } catch {
    return 0;
  }
}

export function FilteredPage({ games }: FilteredPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [page, setPage] = useState(1);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailOpenMobile, setDetailOpenMobile] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [moveIdx, setMoveIdx] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);

  // ── Filters (URL-persisted) ────────────────────────────────────────────────
  const filters = parseFilters(new URLSearchParams(searchParams.toString()));
  const active = hasActiveFilters(filters);
  const topPlayers = useMemo(() => getTopPlayers(games, 15), [games]);

  // selectedId — persisted in URL as `sel`
  const rawSel = searchParams.get("sel");
  const filteredGames = useMemo(() => filterGames(games, filters), [games, filters]);
  const sortedGames = useMemo(() => sortGames(filteredGames, filters.sort), [filteredGames, filters.sort]);

  const defaultId = sortedGames[0]?.id ?? games[0]?.id ?? null;
  const selectedId = rawSel ?? defaultId;
  const selectedGame = useMemo(
    () => games.find((g) => g.id === selectedId) ?? games[0] ?? null,
    [games, selectedId],
  );

  const totalMoves = useMemo(
    () => getMoveCount(selectedGame?.pgn),
    [selectedGame?.pgn],
  );

  // Reset moveIdx when selection changes
  const prevSelected = useRef(selectedId);
  useEffect(() => {
    if (prevSelected.current !== selectedId) {
      setMoveIdx(0);
      prevSelected.current = selectedId;
    }
  }, [selectedId]);

  // ── Update helpers ─────────────────────────────────────────────────────────
  const updateFilters = useCallback(
    (updates: Partial<Filters>) => {
      setPage(1);
      const next = serializeFilters({ ...filters, ...updates });
      const sel = selectedId ? `&sel=${selectedId}` : "";
      router.replace(next ? `${pathname}?${next}${sel}` : pathname, { scroll: false });
    },
    [filters, pathname, router, selectedId],
  );

  const resetFilters = useCallback(
    () => updateFilters(DEFAULT_FILTERS),
    [updateFilters],
  );

  const selectGame = useCallback(
    (id: string) => {
      const qs = serializeFilters(filters);
      const next = qs ? `${pathname}?${qs}&sel=${id}` : `${pathname}?sel=${id}`;
      router.replace(next, { scroll: false });
      setMoveIdx(0);
      // On mobile, open the detail drawer
      if (typeof window !== "undefined" && window.matchMedia("(max-width: 1099px)").matches) {
        setDetailOpenMobile(true);
      }
    },
    [filters, pathname, router],
  );

  const copyLink = useCallback(() => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useKeyboard({
    totalMoves,
    moveIdx,
    onMoveIdx: setMoveIdx,
    onFlip: () => setFlipped((v) => !v),
    onCloseFullscreen: () => setFullscreen(false),
    isFullscreen: fullscreen,
  });

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(sortedGames.length / PAGE_SIZE);
  const pageStart = (page - 1) * PAGE_SIZE;
  const pagedGames = sortedGames.slice(pageStart, pageStart + PAGE_SIZE);

  // Active filter count (for badge)
  const activeFilterCount =
    Object.entries(filters)
      .filter(([k, v]) => {
        if (k === "sort") return v !== "overall";
        if (k === "players") return (v as string[]).length > 0;
        if (k === "timeControl") return v !== "all";
        if (k === "search") return (v as string).trim().length > 0;
        return (v as number) > 0;
      }).length;

  return (
    <>
      <Header
        gamesShown={sortedGames.length}
        totalGames={games.length}
        sort={filters.sort}
        onSortChange={(sort) => updateFilters({ sort: sort as Filters["sort"] })}
        search={filters.search}
        onSearchChange={(search) => updateFilters({ search })}
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilterCount={activeFilterCount}
        linkCopied={linkCopied}
        onCopyLink={copyLink}
      />

      {/* Main 3-col grid */}
      <div
        className="flex min-h-[calc(100vh-72px)] max-w-[1600px] mx-auto"
        style={{ height: "calc(100vh - 72px)" }}
      >
        {/* Colonne gauche : filtres */}
        <FilterPanel
          filters={filters}
          onUpdate={updateFilters}
          onReset={resetFilters}
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          topPlayers={topPlayers}
        />

        {/* Colonne centre : liste */}
        <main
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ minWidth: 0 }}
        >
          <GameList
            games={pagedGames}
            onReset={resetFilters}
            rankOffset={pageStart}
            selectedId={selectedId}
            onSelect={selectGame}
            totalFiltered={sortedGames.length}
            totalGames={games.length}
          />

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </main>

        {/* Colonne droite : détail — drawer sur mobile */}
        {selectedGame && (
          <>
            {/* Scrim mobile */}
            {detailOpenMobile && (
              <div
                className="fixed inset-0 z-30 lg:hidden"
                style={{ background: "rgba(0,0,0,0.5)" }}
                onClick={() => setDetailOpenMobile(false)}
                aria-hidden="true"
              />
            )}
            <div
              className={`
                fixed top-0 right-0 h-full z-40 overflow-y-auto
                lg:static lg:h-auto lg:z-auto
                transition-transform duration-200 ease-out
                ${detailOpenMobile ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
              `}
            >
              <DetailPanel
                game={selectedGame}
                moveIdx={moveIdx}
                onMoveIdx={setMoveIdx}
                flipped={flipped}
                onFlip={() => setFlipped((v) => !v)}
                onClose={() => setDetailOpenMobile(false)}
                onOpenFullscreen={() => setFullscreen(true)}
              />
            </div>
          </>
        )}
      </div>

      {/* Plein écran */}
      {fullscreen && selectedGame && (
        <FullscreenView
          game={selectedGame}
          moveIdx={moveIdx}
          onMoveIdx={setMoveIdx}
          flipped={flipped}
          onFlip={() => setFlipped((v) => !v)}
          onClose={() => setFullscreen(false)}
        />
      )}
    </>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <nav
      aria-label="Navigation par pages"
      className="flex items-center justify-center gap-6 mt-8 pb-8"
    >
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="font-mono text-[12px] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ color: "var(--text-muted)" }}
      >
        ← Précédent
      </button>
      <span className="font-mono text-[12px] tabular-nums" style={{ color: "var(--text-dim)" }}>
        {page} / {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="font-mono text-[12px] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ color: "var(--text-muted)" }}
      >
        Suivant →
      </button>
    </nav>
  );
}
