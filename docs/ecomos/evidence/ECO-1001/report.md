# ECO-1001 — Audit-invalidated completion and certification language

**Commit:** `cd7ab4b` (docs) · **Audit source:** `Run audit.md`, 2026-10-11

## What was done

Wrote the withdrawal record and marked the invalidated acceptance claims pending
without deleting history.

- `docs/ecomos/release/CORRECTION_2026-10-11.md` — finding-by-finding: what is
  withdrawn, what is explicitly **not** withdrawn, which evidence is now
  insufficient, the proof required to restore each claim, the corrections applied,
  and the hub task map.
- `docs/ecomos/PHASE_9_REPORT.md` — audit banner; the release regression command
  corrected to two commands with separate exit codes; the production-certification
  attestation withdrawn.
- `docs/ecomos/PROGRESS.md` — correction section: the "PHP executable unavailable"
  line is no longer true (PHP 8.2.29 is present), the install completed, and the
  production build had never been run.

## Verification performed

| Check | Result |
| --- | --- |
| Every implicated source file read before writing a verdict | yes |
| Claims attributed to the document that made them | yes (table in the correction record) |
| Original text preserved | yes — claims are labelled withdrawn, not deleted |
| Claims that survived the audit stated explicitly | yes (`What is not withdrawn`) |

## Not claimed

This task corrects language and evidence status. It does not make the product work;
the code repairs are ECO-1002 through ECO-1013. The correction record states that the
hub's acceptance entries are journal records, not runtime proof.
