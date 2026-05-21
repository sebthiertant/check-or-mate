import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  filterGames,
  hasActiveFilters,
  parseFilters,
  serializeFilters,
  sortGames,
} from "@/lib/filters";
import type { Game } from "@/lib/types";
import gamesJson from "../../data/scores.json";

const FIXTURES = gamesJson as unknown as Game[];

// ── parseFilters ──────────────────────────────────────────────────────────────

describe("parseFilters", () => {
  it("returns defaults for empty params", () => {
    expect(parseFilters(new URLSearchParams())).toEqual(DEFAULT_FILTERS);
  });

  it("parses valid dimension thresholds", () => {
    const filters = parseFilters(
      new URLSearchParams("sacrifice=70&eval_swing=50"),
    );
    expect(filters.sacrifice).toBe(70);
    expect(filters.eval_swing).toBe(50);
  });

  it("ignores values outside [0, 100]", () => {
    const filters = parseFilters(
      new URLSearchParams("sacrifice=999&eval_swing=-5"),
    );
    expect(filters.sacrifice).toBe(0);
    expect(filters.eval_swing).toBe(0);
  });

  it("ignores non-numeric values", () => {
    const filters = parseFilters(new URLSearchParams("sacrifice=abc"));
    expect(filters.sacrifice).toBe(0);
  });

  it("parses the sort key", () => {
    expect(parseFilters(new URLSearchParams("sort=sacrifice")).sort).toBe(
      "sacrifice",
    );
  });

  it("ignores an invalid sort key", () => {
    expect(parseFilters(new URLSearchParams("sort=invalid")).sort).toBe(
      "overall",
    );
  });

  it("accepts boundary value 0", () => {
    expect(parseFilters(new URLSearchParams("sacrifice=0")).sacrifice).toBe(0);
  });

  it("accepts boundary value 100", () => {
    expect(parseFilters(new URLSearchParams("sacrifice=100")).sacrifice).toBe(
      100,
    );
  });
});

// ── serializeFilters ──────────────────────────────────────────────────────────

describe("serializeFilters", () => {
  it("returns empty string for default filters", () => {
    expect(serializeFilters(DEFAULT_FILTERS)).toBe("");
  });

  it("includes non-zero dimension thresholds", () => {
    const qs = serializeFilters({ ...DEFAULT_FILTERS, sacrifice: 70 });
    expect(qs).toContain("sacrifice=70");
  });

  it("omits dimensions that are at 0", () => {
    const qs = serializeFilters({ ...DEFAULT_FILTERS, sacrifice: 50 });
    expect(qs).not.toContain("eval_swing");
  });

  it("includes sort when not overall", () => {
    const qs = serializeFilters({ ...DEFAULT_FILTERS, sort: "sacrifice" });
    expect(qs).toContain("sort=sacrifice");
  });

  it("omits sort when it is overall", () => {
    const qs = serializeFilters({ ...DEFAULT_FILTERS, sort: "overall" });
    expect(qs).not.toContain("sort");
  });

  it("round-trips through parseFilters", () => {
    const original = {
      ...DEFAULT_FILTERS,
      sacrifice: 70,
      brilliancy: 40,
      sort: "sacrifice" as const,
    };
    const roundTripped = parseFilters(
      new URLSearchParams(serializeFilters(original)),
    );
    expect(roundTripped).toEqual(original);
  });
});

// ── filterGames ───────────────────────────────────────────────────────────────

describe("filterGames", () => {
  it("returns all games when all thresholds are 0", () => {
    expect(filterGames(FIXTURES, DEFAULT_FILTERS)).toHaveLength(
      FIXTURES.length,
    );
  });

  it("returns only games above the threshold", () => {
    const filters = { ...DEFAULT_FILTERS, sacrifice: 50 };
    const result = filterGames(FIXTURES, filters);
    expect(result.every((g) => g.scores.sacrifice >= 50)).toBe(true);
  });

  it("applies multiple thresholds simultaneously", () => {
    const filters = { ...DEFAULT_FILTERS, sacrifice: 40, brilliancy: 40 };
    const result = filterGames(FIXTURES, filters);
    expect(
      result.every(
        (g) => g.scores.sacrifice >= 40 && g.scores.brilliancy >= 40,
      ),
    ).toBe(true);
  });

  it("returns empty array when threshold is 100 on a low-scoring dimension", () => {
    // No fixture game scores 100 on every dimension.
    const filters = {
      ...DEFAULT_FILTERS,
      sacrifice: 100,
      eval_swing: 100,
      brilliancy: 100,
    };
    const result = filterGames(FIXTURES, filters);
    expect(result).toHaveLength(0);
  });

  it("does not mutate the input array", () => {
    const copy = [...FIXTURES];
    filterGames(FIXTURES, { ...DEFAULT_FILTERS, sacrifice: 50 });
    expect(FIXTURES).toEqual(copy);
  });
});

// ── sortGames ─────────────────────────────────────────────────────────────────

describe("sortGames", () => {
  it("sorts descending by overall", () => {
    const sorted = sortGames(FIXTURES, "overall");
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].scores.overall).toBeGreaterThanOrEqual(
        sorted[i + 1].scores.overall,
      );
    }
  });

  it("sorts descending by a specific dimension", () => {
    const sorted = sortGames(FIXTURES, "sacrifice");
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].scores.sacrifice).toBeGreaterThanOrEqual(
        sorted[i + 1].scores.sacrifice,
      );
    }
  });

  it("does not mutate the input array", () => {
    const original = [...FIXTURES];
    sortGames(FIXTURES, "overall");
    expect(FIXTURES).toEqual(original);
  });
});

// ── hasActiveFilters ──────────────────────────────────────────────────────────

describe("hasActiveFilters", () => {
  it("returns false for default filters", () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
  });

  it("returns true when any threshold is non-zero", () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sacrifice: 50 })).toBe(true);
  });

  it("returns true when sort is not overall", () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sort: "sacrifice" })).toBe(
      true,
    );
  });

  it("returns true when players is non-empty", () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, players: ["hikaru"] })).toBe(
      true,
    );
  });
});

// ── player filter ─────────────────────────────────────────────────────────────

describe("filterGames — players", () => {
  it("returns all games when players is empty", () => {
    expect(filterGames(FIXTURES, DEFAULT_FILTERS)).toHaveLength(
      FIXTURES.length,
    );
  });

  it("keeps only games featuring a selected player", () => {
    if (FIXTURES.length === 0) return;
    const player = FIXTURES[0].white;
    const result = filterGames(FIXTURES, {
      ...DEFAULT_FILTERS,
      players: [player],
    });
    expect(
      result.every(
        (g) =>
          g.white.toLowerCase() === player.toLowerCase() ||
          g.black.toLowerCase() === player.toLowerCase(),
      ),
    ).toBe(true);
  });
});

describe("parseFilters — players", () => {
  it("parses a single player from the players param", () => {
    expect(parseFilters(new URLSearchParams("players=hikaru")).players).toEqual(
      ["hikaru"],
    );
  });

  it("parses multiple comma-separated players", () => {
    expect(
      parseFilters(new URLSearchParams("players=hikaru,magnuscarlsen")).players,
    ).toEqual(["hikaru", "magnuscarlsen"]);
  });

  it("returns empty array when players param is absent", () => {
    expect(parseFilters(new URLSearchParams()).players).toEqual([]);
  });
});

describe("serializeFilters — players", () => {
  it("includes players when non-empty", () => {
    expect(
      serializeFilters({ ...DEFAULT_FILTERS, players: ["hikaru"] }),
    ).toContain("players=hikaru");
  });

  it("omits players when empty", () => {
    expect(serializeFilters(DEFAULT_FILTERS)).not.toContain("players");
  });
});
