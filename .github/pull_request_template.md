## What this PR does

<!-- One paragraph. What problem does it solve? What is the approach? -->

Closes #

---

## Checklist

- [ ] The scope matches the linked issue — nothing more, nothing less
- [ ] New code has unit tests (or I've explained why tests aren't needed)
- [ ] `uv run ruff check` and `uv run mypy` pass locally (Python changes)
- [ ] `pnpm --filter web typecheck` passes locally (TypeScript changes)
- [ ] The `data/games.db` schema migration is forward-only and named `NNNN_description.sql` (schema changes)
- [ ] `DEVELOPMENT.md` / ADRs updated if this changes a process or architectural decision

## How to test

<!-- Minimal steps for a reviewer to verify the change works. -->

```bash
# example
uv run pytest packages/ingestion/tests/ -k "test_incremental_sync"
```

## Screenshots / output (if applicable)

<!-- For front-end or CLI changes, paste a screenshot or terminal output. -->
