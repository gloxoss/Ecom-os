# ECO-1010 — Attributable owner evidence for merchant facts and product claims

**Commit:** `cd7ab4b` · **Audit finding:** 8

## Defects reproduced

- `release/APPROVAL.md` described the compliance dossier as signed;
  `clients/paraloca/content-approval.md` stated an entity, registered address,
  support phone, warranty terms and tax rates with no signatory and no attestation.
- `evidence/ECO-806/claim-inventory.md` marked six product claims **APPROVED**, each
  supported only by a *description* of the document that would support it ("Fiche
  technique fabricant", "Validation clinique ESH") — no document, no model.
- Public strings asserted certification the merchant has not evidenced.

## Repairs

- `clients/paraloca/content-approval.md` is now a **pending-approval register**: eight
  merchant facts each marked `UNAPPROVED` with what the owner must confirm, and an
  approval table that is empty. The support phone value is called out as an obvious
  placeholder. The two framework invariants that are code policy, not owner facts
  (Zero Invented Registrations, Zero Clinical Superiority Claims), are preserved.
- `evidence/ECO-806/claim-inventory.md`: the six `APPROVED` verdicts are withdrawn to
  `PENDING OWNER EVIDENCE`, each with the specific source now required; CLM-07/CLM-08
  stay blocked. The record states this is "nothing substantiates it", not "it is false".
- Public strings asserting unverified conformity or homologation were replaced with
  statements that neither claim nor deny certification:
  - `profile.ts` compliance disclaimers now direct the customer to the manufacturer's
    notices for norms and certifications, and describe the warranty as the
    manufacturer's conditions.
  - `content-schema.ts` brand descriptions dropped "certifié" / "homologués" (FR and AR).

## Verification

| Check | Result |
| --- | --- |
| `tsx --test clients/paraloca/*.test.ts` | exit 0 — 19 passed |
| `vitest run` (whole suite) | exit 0 — 521 passed |
| `tsc -p apps/storefront/tsconfig.json --noEmit --incremental false` | exit 0 |
| Dossier retains the framework strings its own test asserts | yes |

## What this task cannot do

**The owner input does not exist yet.** No agent can supply the real entity details,
contact details, warranty terms, tax treatment, or the product-specific source
documents. This task makes the gap visible and blocking, which is what the audit
required: pending facts must remain visibly pending and cannot support a release
certification.
