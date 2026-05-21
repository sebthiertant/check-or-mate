import type { Game } from "./types";

export interface PlayerEntry {
  username: string;
  maxRating: number;
}

/** Return the top-N players by peak Elo seen in the games corpus. */
export function getTopPlayers(games: Game[], n: number): PlayerEntry[] {
  const best = new Map<string, PlayerEntry>();
  for (const game of games) {
    updateBest(best, game.white, game.white_rating);
    updateBest(best, game.black, game.black_rating);
  }
  return [...best.values()]
    .sort((a, b) => b.maxRating - a.maxRating)
    .slice(0, n);
}

function updateBest(
  map: Map<string, PlayerEntry>,
  username: string,
  rating: number,
): void {
  const key = username.toLowerCase();
  const entry = map.get(key);
  if (!entry || rating > entry.maxRating) {
    map.set(key, { username, maxRating: rating });
  }
}
