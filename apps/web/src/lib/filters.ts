import type { Game, ScoreDimension, Scores } from "./types";

export type SortKey = keyof Scores;
export type TimeControl = "all" | "Bullet" | "Blitz" | "Rapid";

export interface Filters {
  sacrifice: number;
  eval_swing: number;
  brilliancy: number;
  time_pressure: number;
  endgame_quality: number;
  rating_upset: number;
  opening_rarity: number;
  sort: SortKey;
  players: string[];
  timeControl: TimeControl;
  search: string;
}

export const SCORE_DIMENSIONS = [
  "sacrifice",
  "eval_swing",
  "brilliancy",
  "time_pressure",
  "endgame_quality",
  "rating_upset",
  "opening_rarity",
] as const satisfies readonly ScoreDimension[];

export const SORT_KEYS = [
  ...SCORE_DIMENSIONS,
  "overall",
] as const satisfies readonly SortKey[];

export const DEFAULT_FILTERS: Filters = {
  sacrifice:       0,
  eval_swing:      0,
  brilliancy:      0,
  time_pressure:   0,
  endgame_quality: 0,
  rating_upset:    0,
  opening_rarity:  0,
  sort:            "overall",
  players:         [],
  timeControl:     "all",
  search:          "",
};

const TIME_CONTROL_VALUES: TimeControl[] = ["all", "Bullet", "Blitz", "Rapid"];

/** Parse URL search params into a Filters object. */
export function parseFilters(params: URLSearchParams): Filters {
  const filters = { ...DEFAULT_FILTERS };

  for (const dim of SCORE_DIMENSIONS) {
    const raw = params.get(dim);
    if (raw === null) continue;
    const value = parseInt(raw, 10);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      filters[dim] = value;
    }
  }

  const rawSort = params.get("sort");
  if (rawSort && (SORT_KEYS as readonly string[]).includes(rawSort)) {
    filters.sort = rawSort as SortKey;
  }

  const rawPlayers = params.get("players");
  if (rawPlayers) {
    filters.players = rawPlayers.split(",").filter(Boolean);
  }

  const rawTc = params.get("tc");
  if (rawTc && (TIME_CONTROL_VALUES as string[]).includes(rawTc)) {
    filters.timeControl = rawTc as TimeControl;
  }

  const rawSearch = params.get("q");
  if (rawSearch) {
    filters.search = rawSearch;
  }

  return filters;
}

/** Serialize Filters to URL query string. Omits default values. */
export function serializeFilters(filters: Filters): string {
  const params = new URLSearchParams();

  for (const dim of SCORE_DIMENSIONS) {
    if (filters[dim] > 0) params.set(dim, String(filters[dim]));
  }

  if (filters.sort !== "overall") params.set("sort", filters.sort);
  if (filters.players.length > 0) params.set("players", filters.players.join(","));
  if (filters.timeControl !== "all") params.set("tc", filters.timeControl);
  if (filters.search.trim()) params.set("q", filters.search.trim());

  return params.toString();
}

/** Return games matching all active filters (AND logic). */
export function filterGames(games: Game[], filters: Filters): Game[] {
  const q = filters.search.trim().toLowerCase();

  return games.filter((game) => {
    // Player filter (OR within selected players)
    if (filters.players.length > 0) {
      const wl = game.white.toLowerCase();
      const bl = game.black.toLowerCase();
      if (!filters.players.some((p) => p.toLowerCase() === wl || p.toLowerCase() === bl)) {
        return false;
      }
    }

    // Dimension thresholds
    if (!SCORE_DIMENSIONS.every((dim) => game.scores[dim] >= filters[dim])) {
      return false;
    }

    // Time control
    if (filters.timeControl !== "all") {
      const tc = game.time_class;
      if (tc.toLowerCase() !== filters.timeControl.toLowerCase()) return false;
    }

    // Free text search
    if (q) {
      const hay = `${game.white} ${game.black} ${game.eco} ${game.opening_name}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });
}

/** Return a new sorted copy (descending). */
export function sortGames(games: Game[], sortKey: SortKey): Game[] {
  return [...games].sort((a, b) => b.scores[sortKey] - a.scores[sortKey]);
}

/** True when any filter deviates from defaults. */
export function hasActiveFilters(filters: Filters): boolean {
  return (
    SCORE_DIMENSIONS.some((dim) => filters[dim] > 0) ||
    filters.sort !== "overall" ||
    filters.players.length > 0 ||
    filters.timeControl !== "all" ||
    filters.search.trim().length > 0
  );
}
