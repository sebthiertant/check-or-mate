# Stacked pull request demo

**Demo only:** this four-layer documentation stack is for demonstration and
explanation. It does not change application behavior, scoring, data, or automation.

A stacked pull request depends on the changes in the pull request below it.
The first PR targets `main`; each later PR targets the preceding PR's branch.
This lets reviewers focus on one small layer at a time while retaining the
context supplied by earlier layers.

## Planned dependency chain

```text
main <- PR 1 <- PR 2 <- PR 3 <- PR 4
```

Each arrow points to the layer's base. The numbers are illustrative layer labels,
not GitHub pull request numbers. This diagram describes the planned stack, not
confirmation that all four PRs already exist.

## Foundation (PR 1)

This layer establishes the shared document and dependency model. It is the
bottom of the stack and targets `main`, with no dependency on another demo PR.

The later layers will extend this same file with a walkthrough (PR 2), review
examples (PR 3), and presenter notes (PR 4). They build on this foundation rather
than repeating it in separate documents.
