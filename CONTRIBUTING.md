# Contributing to check-or-mate

Thank you for your interest! This is primarily a personal portfolio project, but issues and pull requests are welcome.

## Ground rules

- One concern per PR. Small, focused changes are much easier to review.
- Open an issue before starting significant work — discuss first, code second.
- All commits must pass CI (lint, type-check, tests). The `pre-commit` hook enforces this locally.

## Development setup

The fastest path is **GitHub Codespaces** — click *Code → Codespaces → Create codespace on main*. Everything is pre-installed via `.devcontainer/`.

Locally:

```bash
# Prerequisites: Node 20+, Python 3.12+, Stockfish 16
git clone https://github.com/sebthiertant/check-or-mate
cd check-or-mate
pnpm install
uv sync --all-packages
cp .env.example .env          # no secrets required for local dev
```

## Issue labels

| Label | Meaning |
|---|---|
| `good first issue` | Isolated, well-defined — no prior context needed |
| `adr` | Requires or proposes an Architecture Decision Record |
| `bug` | Something doesn't work as described |
| `enhancement` | New feature or improvement |
| `data` | Relates to ingestion, scoring, or the SQLite schema |

## Commit style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(ingestion): add incremental month diffing
fix(analysis): clamp sacrifice_score to [0, 100]
docs(adr): add ADR-0003 for Stockfish version pinning
```

## ADR process

If your change alters a fundamental technical choice (storage, language, hosting…), propose an ADR:

1. Open an issue with the `adr` label.
2. Draft the ADR in `docs/adr/NNNN-title.md` following the existing format.
3. Reference the issue in the PR.

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
