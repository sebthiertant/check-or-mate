# Stacked pull requests demo

Documentation-only demo of a 4-layer PR stack. Each PR targets the branch of the one below it:

| # | Branch | Base |
|---|--------|------|
| 1/4 | `stack-demo/1-foundation` | `main` |
| 2/4 | `stack-demo/2-walkthrough` | `stack-demo/1-foundation` |
| 3/4 | `stack-demo/3-review-examples` | `stack-demo/2-walkthrough` |
| 4/4 | `stack-demo/4-presenter-notes` | `stack-demo/3-review-examples` |

Each PR's diff only shows its own layer. Do not merge — this is for explanation only.
