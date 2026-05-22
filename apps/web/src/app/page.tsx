import { Suspense } from "react";

import { loadGames } from "@/lib/loadGames";
import { FilteredPage } from "@/components/FilteredPage";

export default function HomePage() {
  const games = loadGames();
  return (
    <main>
      <Suspense>
        <FilteredPage games={games} />
      </Suspense>
    </main>
  );
}
