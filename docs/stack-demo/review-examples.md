# Review examples

- Review each layer independently; comments stay scoped to that layer's diff.
- If layer 1 changes, rebase layers 2–4 on top (e.g. `git rebase --update-refs`).
- Reviewers can approve lower layers while upper ones are still in progress.
