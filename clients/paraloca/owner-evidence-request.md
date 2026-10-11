# ParaLoca — owner evidence request

**Who this is for:** the owner. **Why:** the 2026-10-11 run audit found that the release
record asserted merchant facts and product claims with nothing behind them. Finding 8. No
agent can produce these — they are facts about your business and your products — so this is
the complete list of what is missing, in the form it is needed.

Fill in the right-hand column, or attach the document named, and the two registers
(`content-approval.md` and `evidence/ECO-806/claim-inventory.md`) can be closed.

## 1. Merchant facts — currently all `UNAPPROVED`

These appear in `clients/paraloca/content-approval.md` and in the storefront's public
strings. Each is a placeholder put in during development.

| # | Fact | Current placeholder | What to supply |
| --- | --- | --- | --- |
| 1 | Legal entity name | `ParaLoca SARL` | The exact registered name, or a different legal form |
| 2 | Registered address | `Boulevard d'Anfa, Casablanca` | Full registered address, with number and postal code |
| 3 | Support email | `contact@paraloca.ma` | Confirm the mailbox exists and is monitored, or give the real one |
| 4 | Support phone | `+212 5 22 00 00 00` | The real number — the current one is plainly a placeholder |
| 5 | Standard VAT rate | `20%` | Confirm against your tax registration |
| 6 | Reduced VAT rate | `7%` on eligible prostheses/orthotics | Confirm it applies to the lines you actually sell |
| 7 | Warranty | "Manufacturer warranty, 12–36 months" | Which brands, which durations, who honours it |
| 8 | Local service | "verified local Casablanca service" | Who performs service, under what agreement |

## 2. Product claims — currently `PENDING OWNER EVIDENCE`

Each needs the **document itself**, naming the **exact product model**. A description of the
document is what the audit rejected.

| Claim | Product | Statement | Document needed |
| --- | --- | --- | --- |
| CLM-01 | Fauteuil Roulant Pro | Light aluminium frame, double cross-brace, foldable | Manufacturer technical sheet, model named |
| CLM-02 | Fauteuil Roulant Pro | 120 kg maximum load | ISO 7176 load-test report, model and load named |
| CLM-03 | Matelas Anti-Escarres | Alternating-pressure compressor, 12-minute cycle | Manufacturer notice giving the cycle time for the exact model |
| CLM-04 | Matelas Anti-Escarres | Prevents stage I and II pressure ulcers | EPUAP classification reference valid for this device, plus labelling |
| CLM-05 | Tensiomètre Rossmax | Atrial fibrillation detection algorithm | The device's own clinical validation citation (e.g. ESH), model named |
| CLM-06 | Attelle Poignet | Removable palmar aluminium support | Manufacturer specification for the exact product |

## 3. Statements currently withdrawn from public content

These were asserting certification the business has not evidenced, and were replaced with
neutral wording. If any is factually true and you can evidence it, it can go back:

- "matériel certifié" (ParaLoca brand description) — withdrawn
- "équipements … homologués" (Invacare brand description) — withdrawn
- "conformes aux normes et certifications applicables au Maroc" (compliance disclaimer) — \
  withdrawn
- "Garantie constructeur sur les équipements homologués" — withdrawn, pending fact 7

## 4. The approval record

An attributable approval needs, at minimum: **who** approved, **their role**, the **date**,
and the **exact list of items**. Nothing else on this page is valid without it.

```
Approved items: ____________________
Approved by:    ____________________  (name and role)
Date:           ____________________
Reference:      ____________________  (signature, or an email/file you can point to)
```

Until that block is filled, the honest status of every item above is **unapproved**, and no
release certification may cite them. That is what finding 8 requires and the only part of
the audit still outstanding.
