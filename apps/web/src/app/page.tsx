import { FIXTURES } from "@/lib/fixtures"
import { Header } from "@/components/Header"
import { GameCard } from "@/components/GameCard"

export default function HomePage() {
  const games = [...FIXTURES].sort((a, b) => b.scores.overall - a.scores.overall)

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Header gameCount={games.length} />
        <section aria-label="Curated games">
          <div className="flex flex-col gap-4">
            {games.map((game, index) => (
              <GameCard key={game.id} game={game} rank={index + 1} />
            ))}
          </div>
        </section>
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
  )
}
