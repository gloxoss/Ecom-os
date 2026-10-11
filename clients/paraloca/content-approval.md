# ParaLoca — Medical & Legal Content Approval Dossier

- **Document Version**: 2.0.0
- **Entity**: ParaLoca SARL (Casablanca, Maroc)
- **Domain**: `paraloca.ma`
- **Applicable Framework**: Moroccan Law 84-12 (Medical Devices) & Law 31-08 (Consumer Protection)
- **Approval status**: **NOT APPROVED — no signatory on record** (revised 2026-10-11)

> ## ⚠ This dossier is not signed and does not approve anything yet
>
> Revision 1.0.0 of this document stated an entity, a registered address, a support
> phone number, warranty terms and tax rates. It carried no signatory, no owner
> attestation and no date of approval, and the release record nonetheless
> described the dossier as signed. The 2026-10-11 run audit rejected that.
>
> Everything in section 3 below is a **proposal**, not an approved fact. Each item
> is marked `UNAPPROVED` and needs the owner's sign-off in the record at section 4.
> Nothing here may support a release certification, and these strings must not be
> treated as publishable client facts until they are signed.
>
> Two of the three framework invariants (Zero Invented Registrations, Zero
> Clinical Superiority Claims) are *policies this codebase enforces* and remain in
> force. They are not owner facts and are unaffected by the signature gap.

---

## 1. Compliance Thesis & Invariants

ParaLoca sells and distributes home-care and professional medical devices. In strict adherence to EcomOS architectural invariants and regulatory best practices:
1. **Zero Invented Registrations**: No fictitious Moroccan Ministry of Health (DMP - Direction du Médicament et de la Pharmacie) registration numbers, CE marks, or FDA certs are fabricated.
2. **Zero Clinical Superiority Claims**: Content must never promise disease cures, guaranteed therapeutic outcomes, or replace professional medical consultations.
3. **Factual Warranty Disclosures**: Guarantees are limited to standard manufacturer warranties (12–36 months) with verified local Casablanca service.
4. **Mandatory Patient Disclaimers**: All diagnostic, orthopaedic, and mobility equipment PDPs must display standard legal notices directing users to health professionals.

---

## 2. Category Claims Audit

| Category | Permitted Claims | Strictly Blocked / Unverified |
| :--- | :--- | :--- |
| **Mobilité & Autonomie** | Poids maximum supporté, dimensions plié, structure aluminium, double croisillon | "Conduite tout terrain sans risque", fausses normes d’homologation |
| **Maintien à Domicile** | Épaisseur matelas, compresseur à cycle alterné, motorisation certifiée | "Élimination garantie des escarres à 100%", fausse certification hospitalière |
| **Diagnostic & Suivi** | Détection d'arythmie indicatif, brassard ergonomique, mémoire lectures | "Diagnostic médical autonome sans médecin", "Homologation OMS exclusive" |
| **Orthopédie & Soutien** | Maintien lombaire réglable, baleines souples, tissu respirant lavable | "Guérison de hernie discale", fausses mentions de remboursement CNSS/CNOPS |

---

## 3. Importer & Merchant Disclosures — proposed values, all UNAPPROVED

Every value below is a placeholder supplied during development. None has been
confirmed by the merchant. Substituting the real values is owner work.

| # | Fact | Current value | Status | Owner must confirm |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Legal entity name | `ParaLoca SARL` | **UNAPPROVED** | Exact registered company name, or whether a different legal form applies |
| 2 | Registered address | `Boulevard d'Anfa, Casablanca, Maroc` | **UNAPPROVED** | Full registered address including street number and postal code |
| 3 | Support email | `contact@paraloca.ma` | **UNAPPROVED** | Whether this mailbox exists and is monitored |
| 4 | Support phone | `+212 5 22 00 00 00` | **UNAPPROVED** | Real, reachable support number (the current value is obviously a placeholder) |
| 5 | Standard VAT rate | `20%` | **UNAPPROVED** | Confirmation against the merchant's tax registration |
| 6 | Reduced VAT rate | `7%` on eligible medical prostheses/orthotics | **UNAPPROVED** | Confirmation that the reduced rate applies to the specific product lines sold |
| 7 | Warranty terms | Manufacturer warranty, 12–36 months | **UNAPPROVED** | Which brands, which durations, and who honours the warranty locally |
| 8 | Local service | "verified local Casablanca service" | **UNAPPROVED** | Who performs service, under what agreement |

Blocker: the release packet cannot be certified while rows 1–8 are `UNAPPROVED`.
The audit classified these as unsupported assertions, not as false statements.

---

## 4. Approval record — currently empty

An attributable approval needs, at minimum: the approver's name and role, the
date, and the exact list of items approved. None exists.

| Item(s) approved | Approver (name, role) | Date | Signature / reference |
| :--- | :--- | :--- | :--- |
| — | — | — | — |

Until this table has a real row, the honest status of this dossier is
**unapproved**, and any document that cites it as signed is wrong.

---

## 5. Related records

- Product-level claim evidence is tracked separately in
  [docs/ecomos/evidence/ECO-806/claim-inventory.md](../../docs/ecomos/evidence/ECO-806/claim-inventory.md).
  Those claims are also `PENDING OWNER EVIDENCE`.
- The release withdrawal record is
  [docs/ecomos/release/CORRECTION_2026-10-11.md](../../docs/ecomos/release/CORRECTION_2026-10-11.md).
