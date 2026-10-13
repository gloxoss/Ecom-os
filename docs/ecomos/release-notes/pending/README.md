# Pending release notes

Several agents work in parallel, so nobody edits `FIX_LEDGER.md`, `MIGRATIONS.md` or `CHANGELOG.md` directly. Each task writes ONE new file here, `<TASK-ID>.md`, with three headed parts:

```
## Ledger row
| N | Problem | Found where | Root cause | Starter fix | Status |

## Migration note (next release)
- What changed, who is affected, exact steps, how to confirm, how to roll back.

## Changelog line
- One line.
```

The orchestrator folds the pending files into the three shared documents when it cuts a release, then moves each file to `docs/ecomos/release-notes/released/<version>/`. Claim only your own file path in the hub, so claims never collide.
