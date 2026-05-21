"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FIXTURES } from "@/lib/fixtures";
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

export function FilteredPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = parseFilters(new URLSearchParams(searchParams.toString()));
  const active = hasActiveFilters(filters);

  const updateFilters = useCallback(
    (updates: Partial<Filters>) => {
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

  const filteredGames = filterGames(FIXTURES, filters);
  const sortedGames = sortGames(filteredGames, filters.sort);

  return (
    <>
      <Header gameCount={sortedGames.length} totalCount={FIXTURES.length} />
      <FilterPanel
        filters={filters}
        onUpdate={updateFilters}
        onReset={resetFilters}
        hasActive={active}
      />
      <GameList games={sortedGames} onReset={resetFilters} />
    </>
  );
}
