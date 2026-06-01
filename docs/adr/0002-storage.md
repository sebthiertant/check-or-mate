# ADR-0002: Why SQLite committed to the repo

- **Status:** Superseded by the *Update (2026-06-01)* below — originally Accepted
- **Date:** 2026-05-21
- **Deciders:** Project author

> **Update (2026-06-01) — implementation diverged from this decision.**
>
> The "Repo size grows with the corpus (~14 GB/year)" consequence anticipated below
> materialised faster than expected, so `data/games.db` is **no longer committed**. The
> current implementation:
>
> - keeps `games.db` as a **working store cached between runs via the GitHub Actions
>   cache** (`data/games.db` is gitignored), and
> - commits a lightweight **`apps/web/data/scores.json`** snapshot — the only data
>   artifact in git — which the Next.js front-end reads **at build time** (no `sql.js` /
>   in-browser SQLite, no query-time database connection).
>
> The reasoning below (why SQLite over Turso/Postgres/LFS) still holds for the working
> store; only "where the published artifact lives" changed: from a committed `.db` to a
> committed `.json`. A follow-up ADR will formalise the snapshot format.

## Context

`check-or-mate` needs a storage layer for two SQLite tables (`games_raw`, `games_scored`) and one lookup table (`players`). The data is:

- **Write-seldom, read-often:** ingestion writes once per day; the front-end reads continuously.
- **Batch-produced:** scores are computed offline by GitHub Actions, not on-demand at query time.
- **Moderate in size:** a corpus of 10 000 games + Stockfish evals lands around 20–40 MB — well within git's practical limits.

The question is therefore not *which database engine* (SQLite is already the right answer for a file-based, zero-infra, WASM-queryable store) but **where the database file lives and who owns it**.

## Decision

**Commit `data/games.db` to the repository on `main`.**

The nightly Actions workflows (`ingest.yml`, `analyze.yml`) write to the database, then open a pull request (or push directly to `main` via a bot identity) with the updated file. Vercel picks up the push, rebuilds, and the new data is live within minutes of ingestion completing.

## Alternatives considered

### Turso (libSQL managed cloud SQLite)

**Considered:** Turso offers a managed SQLite service with a generous free tier, a REST API, and edge replication.

**Rejected because:**
- Introduces a dependency on an external service with its own account, credentials, and SLA — this is a portfolio project that should be self-contained.
- The Actions workflow would need to authenticate to Turso and push data over the wire rather than committing a file, adding failure modes with no corresponding benefit at this data size.
- Vercel would need to read from Turso at query time, preventing the fully-static deployment story.

### Postgres on a free hosted tier (Supabase, Neon, Railway)

**Considered:** all three offer a free-tier Postgres. This would enable real-time reads and richer query capabilities.

**Rejected because:**
- Free tiers have compute pauses, connection limits, and storage caps that introduce operational complexity for no gain.
- The front-end would require a server runtime (Vercel serverless function) to proxy queries, adding latency and cost.
- The primary audience for this corpus is a single-page app that needs to answer filter queries; SQLite + `sql.js` in the browser is fast enough for corpora under ~50 MB (see NFR table in [architecture.md](../architecture.md)).
- Losing the git-native workflow: a committed file makes every state of the corpus inspectable, diffable, and rollback-able with `git`.

### Git LFS for the database file

**Considered:** storing the SQLite file in Git LFS to keep the main git history lean.

**Rejected (for now) because:**
- GitHub's LFS free quota is 1 GB storage / 1 GB bandwidth per month — tighter than the plain-git soft limit and harder to reason about for CI.
- The file is expected to stay under 100 MB for the foreseeable future; at that size the git object store handles it without noticeable clone overhead.
- LFS complicates Codespaces setup (requires `git lfs pull` as a separate step).

This decision should be revisited if the database exceeds 100 MB (see *Review triggers* below).

## Consequences

### Positive

- **Zero infrastructure cost:** no external service, no credentials to rotate, no SLA to monitor.
- **Git-native audit trail:** every nightly ingestion is a commit. `git log -- data/games.db` shows exactly when games were added.
- **Fully static deployment:** Vercel builds from the committed file; no server runtime, no database connection at query time.
- **Idempotent re-runs:** the ingestion pipeline is content-addressed (UUID primary keys); running it twice on the same month produces no change to the database and therefore no diff, so the bot does not open a spurious PR.
- **Queryable in the browser:** `sql.js` (WASM) reads the file directly from the Vercel CDN; no API round-trip for filters.

### Negative

- **Repo size grows with the corpus.** Each nightly commit adds a new git object for the full database file (SQLite doesn't produce binary diffs). At 40 MB/snapshot × 365 days, the `.git/` directory could reach ~14 GB after a year of ingestion. Shallow clones and sparse-checkout mitigate this in CI, but it's a real maintenance debt.
- **Concurrent writes are impossible.** Only one process can write at a time. This is fine for a single nightly batch, but rules out any real-time write path without a locking strategy.
- **File-level granularity in git.** A single corrupt ingestion run requires `git revert` of the whole file, not a targeted row delete. The idempotent re-run design mitigates this (clean up + re-ingest), but recovery is less surgical than a managed database.

## Review triggers

This ADR should be revisited if:

- `data/games.db` exceeds **100 MB** → evaluate Git LFS or an external store.
- The `.git/` directory clone size makes **CI clone times** unacceptable (target: < 60 s) → evaluate shallow clones, sparse-checkout, or LFS.
- A **second writer** (e.g., a user-triggered "analyze this game" endpoint) is introduced → SQLite WAL mode + a proper server runtime, or migration to Turso/Postgres.
- **Vercel build times** exceed the free-tier limit → the bundled SQLite file may need to move off the build artifact.
