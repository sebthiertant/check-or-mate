# ADR-0001: Stack choices

- **Status:** Accepted
- **Date:** 2026-05-21
- **Deciders:** Project author

## Context

`check-or-mate` is a personal portfolio project with a dual purpose:

1. **Functional**: build a working tool for discovering spectacular chess games from the Chess.com public API.
2. **Strategic**: serve as the centerpiece of a Solutions Engineer application to GitHub. The project must therefore exemplify what GitHub markets — issues, Actions, Codespaces, Pages, Projects, Releases — as opposed to merely *using* the platform.

The dual purpose constrains the stack: it must be technically sound *and* legibly showcase the GitHub-native developer workflow. A recruiter spending three minutes on the repo should leave with a clear sense of how the author works.

## Decision

The project adopts the following stack:

### Languages

- **Python 3.12** for ingestion and analysis
- **TypeScript** for the front-end
- A code-generation step bridges them (Pydantic → TS types)

### Front-end

- **Next.js 14** (App Router) + **Tailwind CSS** + **shadcn/ui**
- **react-chessboard** + **chess.js** for the board

### Back-end / batch

- **`httpx`** for HTTP, **`python-chess`** for PGN, **Stockfish 16** for evaluation
- **`uv`** for Python project management; **`pnpm`** for the JS workspace
- **SQLite** for storage (committed to the repo, see [ADR-0002](0002-storage.md))

### Infrastructure

- **GitHub Actions** for all CI/CD: lint, test, scheduled ingestion, analysis, release automation
- **Vercel** for the front-end (free tier, preview deployments per PR)
- **GitHub Pages** for the documentation site
- **GitHub Codespaces** with a committed `.devcontainer/` for one-click setup

## Alternatives considered

### Monolingual TypeScript (rejected)

**Considered:** doing ingestion and analysis in Node.js to keep a single language.

**Rejected because:** `python-chess` has no equivalent in the JS ecosystem. `chess.js` is fine for move validation but lacks the PGN annotation handling, engine-driving conveniences, and battle-tested correctness of `python-chess`. The cost of polyglot tooling (two package managers, type-bridging step) is real but small compared to reinventing PGN parsing.

There is also a positive signal in being polyglot: choosing the right tool per job is itself a Solutions Engineer skill.

### Server-rendered with a Postgres back-end (rejected)

**Considered:** a "real" three-tier app with a managed Postgres, a Fastify or FastAPI server, and SSR.

**Rejected because:** introduces hosting cost, a separate database connection management surface, and an always-on server — none of which add value for a read-mostly browser of pre-computed data. SQLite bundled with the build keeps the deployment story to *git push → live site*, which is itself part of the demo.

### Lichess instead of Chess.com (rejected for now)

**Considered:** Lichess has a more permissive API, supports streaming, and provides cloud evaluation.

**Rejected because:** the stated motivation is "the games I'd want to watch," and the watch-list is dominated by players whose primary platform is Chess.com (Hikaru, Magnus, top streamers). Lichess support is tracked as a stretch goal — the ingestion layer is designed to abstract over the source.

### Hosted Postgres / Turso for storage

See [ADR-0002](0002-storage.md) — addressed separately as it merits its own discussion.

## Consequences

### Positive

- **GitHub-native story is intact:** every operation is visible in the repo (Actions log, Projects board, Releases, Issues), making the workflow legible to a recruiter without running anything.
- **Zero-cost hosting:** the project can run indefinitely on free tiers.
- **Reproducible:** Codespaces config makes the dev environment deterministic.
- **Right tool per job:** Python where it shines (PGN, engine), TypeScript where it shines (modern UI).
- **Type safety end-to-end:** generated TS types from Pydantic prevent drift.

### Negative

- **Two ecosystems to maintain:** Python and Node lockfiles, two CI matrices, two sets of formatters/linters. Dependabot helps but doesn't remove the surface.
- **Generated types are a build step:** if the schema changes and types aren't regenerated, the front-end breaks. Mitigated by a `pre-commit` hook and a CI check.
- **SQLite committed to git grows the repo:** acceptable up to ~100 MB, then needs revisiting (Git LFS or external store). See [ADR-0002](0002-storage.md).
- **No real-time:** by design, but worth noting — newest games appear after the next nightly ingestion, not immediately.

## Review triggers

This ADR should be revisited if:

- The project grows beyond a single contributor (the polyglot cost compounds).
- Stockfish analysis budgets exceed GitHub Actions free-tier minutes (currently ample).
- The corpus grows beyond ~100k games (SQLite-in-repo strategy needs replacement; see ADR-0002).
- Chess.com changes its public API terms (the entire data layer is dependent on it).
