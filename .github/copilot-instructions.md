# Copilot instructions — check-or-mate

Purpose: give Copilot/Copilot-powered sessions the repository context they need to make accurate edits.

## 1) Build, test, and lint (commands)

Node / frontend (apps/web)
- Install: pnpm install
- Dev: pnpm --filter web dev
- Build: pnpm --filter web build
- Lint: pnpm --filter web lint
- Typecheck: pnpm --filter web typecheck
- Tests (full): pnpm --filter web test
- Run a single frontend test: pnpm --filter web test -- path/to/testfile
  or: pnpm --filter web test -t "test name"

Python (packages/ingestion, packages/analysis)
- Workspace sync / install deps: uv sync --all-packages
- Lint: uv run ruff check packages/
- Format: uv run ruff format packages/
- Typecheck: uv run mypy packages/
- Tests (full): uv run pytest packages/ -q
- Run a single Python test: uv run pytest packages/analysis/tests/<file>::<test_name> -q

Pre-commit hooks are used (see CONTRIBUTING.md).

## 2) High-level architecture (short)

- Ingestion (packages/ingestion): fetches Chess.com archives, parses PGN with python-chess, writes raw games (incremental by player/year/month).
- Analysis (packages/analysis): replays games, evaluates positions with Stockfish (UCI), computes seven score dimensions, normalizes against corpus, writes scored games and schema in SQLite.
- Presentation (apps/web): Next.js app that reads the committed snapshot apps/web/data/scores.json at build time and ships a client-side filter UI.
- Automation: GitHub Actions orchestrate CI, nightly ingest, and analysis workflows; ingestion/analyze commit back to main with a bot identity.

For details, see docs/architecture.md and README.md.

## 3) Key conventions and repo-specific patterns

- Commit/branch conventions
  - Conventional Commits required (see CONTRIBUTING.md).
  - Branch names: <type>/<issue-number>-<short-description> (e.g., feat/3-chess-com-client).
- ADRs live under docs/adr; open an issue with label `adr` before drafting.
- The front-end is shipped as a static site using a committed snapshot (apps/web/data/scores.json). When modifying scoring or ingestion, ensure the snapshot is regenerated and committed if needed.
- Python workspace is managed via `uv` (uv workspace). Use `uv run <tool> ...` for ruff/mypy/pytest commands.
- Stockfish is a runtime dependency for analysis (pinned in ADRs); analysis caches evaluations by FEN to make re-runs cheap.
- Use pnpm workspaces (node >=20, pnpm@9.15.0). Frontend scripts are namespaced via `--filter web`.
- Tests: frontend uses Vitest; Python uses pytest. Use `-k`/`-t` or file::test selectors to run a single test.
- CI workflows: ci.yml (lint/typecheck/tests), ingest.yml (cron), analyze.yml, release.yml. Avoid editing workflow triggers without ADR.

## 4) Files and docs Copilot should consult first

- README.md — high-level overview and run instructions
- docs/architecture.md — component responsibilities and data model
- CONTRIBUTING.md, DEVELOPMENT.md — workflow, branch naming, local checks
- docs/adr/ — architectural decisions and storage/Stockfish pins
- apps/web/data/scores.json — committed snapshot used by the front-end
- packages/*/README (if present) — package-specific notes

## 5) Assistant-specific notes

- There is a .claude/settings.local.json with allowed CLI snippets; prefer existing scripts (pnpm, uv) over inventing new commands.
- When proposing code changes that touch cross-cutting concerns (scoring model, data schema, CI workflows), suggest an ADR or link to an existing ADR under docs/adr.

---

## 6) Coding guidelines

### Object Calisthenics

These rules (Jeff Bay, popularised by William Durand) apply to every language and guide the codebase toward readable, maintainable, testable code.

**1. One level of indentation per function**
Extract a function as soon as a loop or condition contains another. Use the *Extract Method* pattern.

```js
// No
function process(items) {
  for (const group of items) {
    for (const item of group) {
      if (item.active) { /* ... */ }
    }
  }
}

// Yes
function process(items) {
  for (const group of items) processGroup(group)
}
function processGroup(group) {
  for (const item of group) processItem(item)
}
function processItem(item) {
  if (!item.active) return
  /* ... */
}
```

**2. No `else`**
Use early return. Handle error/guard cases first, keep the nominal path flat.

```js
// No
function login(user) {
  if (isValid(user)) {
    return redirect('/home')
  } else {
    return redirect('/login')
  }
}

// Yes
function login(user) {
  if (!isValid(user)) return redirect('/login')
  return redirect('/home')
}
```

**3. Wrap primitives and strings that carry behaviour**
If a primitive (string, number, boolean) carries business logic, create a dedicated type or object. Avoid *Primitive Obsession*.

```js
// No
function applyDiscount(price, discountPercent) { /* ... */ }

// Yes
class Price { /* validation, formatting, operations */ }
class DiscountRate { /* validates 0-100 */ }
function applyDiscount(price, rate) { /* ... */ }
```

**4. First-class collections**
A class/module that holds a collection holds only that. Filters, sorts, and business rules on the collection live in that dedicated entity.

```js
// No — mixes game state and hand management
class Game { hand = []; score = 0; addCard() {} filterPlayable() {} }

// Yes
class Hand { cards = []; add() {} filterPlayable() {} }
class Game { hand = new Hand(); score = 0; }
```

**5. One dot per line (Law of Demeter)**
Talk only to your immediate neighbours. Don't traverse objects to reach their children. Exception: fluent interfaces and explicit builders.

```js
// No
user.getProfile().getAddress().getCity().toUpperCase()

// Yes
user.getCityName()  // User delegates internally
```

**6. No abbreviations**
If you want to abbreviate, that usually signals the function is too long or the class too broad. A short name must be readable without context.

```js
// No
const usrMgr = new UsrMgr()
function calcTtl(itms) { /* ... */ }

// Yes
const userManager = new UserManager()
function calculateTotal(items) { /* ... */ }
```

**7. Keep entities small**
- No more than **150 lines** per file
- No more than **10 files** per folder/module
- Exceeding these limits signals a need to split into distinct responsibilities

**8. No more than two instance variables per class**
Forces decomposition and strong cohesion. Distinguish classes that *maintain state* from those that *coordinate two concepts*.

```js
// No
class User { id; name; email; role; avatarUrl; createdAt }

// Yes — decomposed by concept
class UserIdentity { id; name }
class UserAccount { identity; role }
```

**9. No getters/setters that expose state for external decisions**
*Tell, don't ask.* Decisions based on an object's state must live inside that object. Raw setters are forbidden; read accessors are tolerated when they serve display, not logic.

```js
// No
game.setScore(game.getScore() + POINTS)

// Yes
game.addPoints(POINTS)  // Game decides how to update its own score
```

### General principles

- **Single Responsibility**: one function does one thing, one class represents one concept.
- **Early return**: validate preconditions at the top, keep the nominal path clear.
- **No premature abstraction**: three similar lines do not yet justify a utility.
- **No defensive code for impossible cases**: validate only at system boundaries (user input, external APIs).
- **No comments that describe what the code does**: the code should read itself. Comment only the *why* when the logic is non-obvious.
- **No out-of-scope improvements**: do not refactor, add types, docstrings, or error handling beyond what is asked.
