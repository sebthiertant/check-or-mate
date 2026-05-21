import fs from "fs";
import path from "path";

import type { Game } from "./types";

/**
 * Read scored games from data/scores.json at Next.js build time.
 * Called only in Server Components; never bundled to the client.
 */
export function loadGames(): Game[] {
  const filePath = path.join(process.cwd(), "data", "scores.json");
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Game[];
}
