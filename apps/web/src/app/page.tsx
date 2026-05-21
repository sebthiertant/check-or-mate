import { Suspense } from "react";

import { loadGames } from "@/lib/loadGames";
import { FilteredPage } from "@/components/FilteredPage";

export default function HomePage() {
  const games = loadGames();
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Suspense>
          <FilteredPage games={games} />
        </Suspense>
        <footer className="mt-16 pt-8 border-t border-zinc-900 text-center">
          <p className="text-zinc-700 text-xs">
            Data from{" "}
            <a
              href="https://www.chess.com/news/view/published-data-api"
              className="text-zinc-600 hover:text-zinc-400 transition-colors underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Chess.com Public API
            </a>
            {" · "}
            <a
              href="https://github.com/sebthiertant/check-or-mate"
              className="text-zinc-600 hover:text-zinc-400 transition-colors underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
