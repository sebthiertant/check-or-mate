"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
import { FilterPanel } from "./FilterPanel";
import { GameList } from "./GameList";
import { Header } from "./Header";
import { getTopPlayers } from "@/lib/topPlayers";

const PAGE_SIZE = 20;

interface FilteredPageProps {
  games: Game[];
}

export function FilteredPage({ games }: FilteredPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [page, setPage] = useState(1);
  const topPlayers = useMemo(() => getTopPlayers(games, 15), [games]);

  const filters = parseFilters(new URLSearchParams(searchParams.toString()));
  const active = hasActiveFilters(filters);

  const updateFilters = useCallback(
    (updates: Partial<Filters>) => {
      setPage(1);
      const next = serializeFilters({ ...filters, ...updates });
      router.replace(next ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    },
    [filters, pathname, router],
  );

  const resetFilters = useCallback(
    () => updateFilters(DEFAULT_FILTERS),
    [updateFilters],
  );

  const filteredGames = filterGames(games, filters);
  const sortedGames = sortGames(filteredGames, filters.sort);
  const totalPages = Math.ceil(sortedGames.length / PAGE_SIZE);
  const pageStart = (page - 1) * PAGE_SIZE;
  const pagedGames = sortedGames.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <>
      <Header gameCount={sortedGames.length} totalCount={games.length} />
      <FilterPanel
        filters={filters}
        onUpdate={updateFilters}
        onReset={resetFilters}
        hasActive={active}
        topPlayers={topPlayers}
      />
      <GameList games={pagedGames} onReset={resetFilters} rankOffset={pageStart} />
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
  function goTo(next: number) {
    onPageChange(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <nav
      aria-label="Page navigation"
      className="flex items-center justify-center gap-6 mt-8 pb-8"
    >
      <button
        disabled={page <= 1}
        onClick={() => goTo(page - 1)}
        className="text-xs text-zinc-400 disabled:text-zinc-700 hover:text-zinc-200 transition-colors disabled:cursor-not-allowed"
      >
        ← Previous
      </button>
      <span className="text-xs text-zinc-600 font-mono tabular-nums">
        {page} / {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => goTo(page + 1)}
        className="text-xs text-zinc-400 disabled:text-zinc-700 hover:text-zinc-200 transition-colors disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </nav>
  );
}
