# Development workflow

This document describes how day-to-day development works on `check-or-mate`. The goal is a clean, traceable history where every change is linked to an issue and every issue is linked to a PR.

---

## 1. Pick an issue

Work is tracked in the [project board](https://github.com/users/sebthiertant/projects/1). Issues are organized as epics (one per milestone) with task checklists inside. Pick an unchecked task, move the issue card to **In Progress**, and assign yourself.

If the task doesn't have an issue yet, open one using the appropriate template under **Issues → New**.

---

## 2. Create a branch

Branch naming convention:

```
<type>/<issue-number>-<short-description>
```

| Type | When |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code restructure, no behaviour change |
| `ci` | GitHub Actions, tooling |
| `chore` | Dependency updates, config tweaks |

Examples:

```bash
git switch -c feat/3-chess-com-client
git switch -c fix/7-retry-after-header
git switch -c docs/2-adr-0003-watchlist-format
```

---

## 3. Develop

Commit often using [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(ingestion): add httpx retry with exponential backoff
fix(analysis): clamp sacrifice_score to [0, 100]
docs(adr): add ADR-0003 watchlist format
```

### Local checks before pushing

```bash
# Python
uv run ruff check packages/
uv run ruff format packages/
uv run mypy packages/
uv run pytest packages/ -q

# TypeScript
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web build
```

---

## 4. Open a pull request

Push your branch and open a PR against `main`:

```bash
git push -u origin feat/3-chess-com-client
gh pr create --fill
```

The PR template includes a `Closes #N` line — fill in the issue number. GitHub will automatically close the issue and move the project card to **Done** when the PR is merged.

PR title follows the same Conventional Commits style:

```
feat(ingestion): implement Chess.com client with retry (#3)
```

---

## 5. Review and merge

- At least one approving review before merge (self-review is fine for solo work — just take a deliberate pass).
- CI must be green (`ci.yml`).
- Merge strategy: **squash and merge** to keep `main` history linear.
- The squash commit message is the PR title — make sure it's clean.

---

## 6. Project board automation

The [project board](https://github.com/users/sebthiertant/projects/1) has the following status columns:

| Status | Meaning |
|---|---|
| 📋 Backlog | Not started |
| 🔄 In Progress | Branch exists, actively worked on |
| 👁️ In Review | PR open |
| ✅ Done | PR merged, issue closed |

GitHub Projects is configured to **automatically add** new issues and PRs from this repository. Status transitions are manual — move the card when you pick up work or open a PR.

---

## Release process

Releases are cut by pushing a version tag:

```bash
git tag v0.2.0
git push origin v0.2.0
```

`release.yml` picks up the tag, generates a changelog from conventional commits via `git-cliff`, and creates a GitHub Release.

Versioning follows [SemVer](https://semver.org/). During development (< v1.0.0), minor bumps introduce new milestones and patch bumps fix bugs.
