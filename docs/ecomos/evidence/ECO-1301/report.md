# ECO-1301 Evidence — ParaLoca Merchant Facts Reconciliation & UAT Dossier

- **Task:** `ECO-1301` · **Stage:** `R` (Release Preparation) · **Lane:** `rfq`
- **Agent:** `sprint-rfq-1` (executor, rfq / merchant lead) · **Coordinator:** `sprint-lead-1`
- **Assignment Base Commit:** `75026293a9b8304d8e00352f17f5b04e6d0cb72c`
- **Branch:** `sprint-integrated-authoritative`
- **Worktree:** `C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/Ecom-os`
- **Verdict:** **PASS (Technical & Regulatory Compliance)** / **BLOCKED (Client Release Sign-Off)**.
  All technical UAT user journeys, brand contracts, and regulatory invariants are verified with zero failures. Missing authentic merchant owner facts correctly keep the client launch gate blocked per EcomOS invariants.

---

## 1. Regulatory Invariants & Merchant Dossier Inspection

In accordance with Moroccan Law 84-12 (Medical Devices) and Law 31-08 (Consumer Rights), `clients/paraloca/content-approval.md` was inspected and verified:

1. **Document Status Invariant**:
   - Header is explicitly retained as: **`NOT APPROVED — no signatory on record`**.
   - Section 4 approval table remains unpopulated (`—`).
   - Zero invented approvals, zero fabricated registration numbers, and zero clinical cure claims.

2. **Eight Proposed Merchant Disclosures Retained as UNAPPROVED**:
   - Fact 1: Legal entity name (`ParaLoca SARL`) -> **UNAPPROVED**
   - Fact 2: Registered address (`Boulevard d'Anfa, Casablanca, Maroc`) -> **UNAPPROVED**
   - Fact 3: Support email (`contact@paraloca.ma`) -> **UNAPPROVED**
   - Fact 4: Support phone (`+212 5 22 00 00 00`) -> **UNAPPROVED**
   - Fact 5: Standard VAT rate (`20%`) -> **UNAPPROVED**
   - Fact 6: Reduced VAT rate (`7%` on medical devices) -> **UNAPPROVED**
   - Fact 7: Warranty terms (12–36 months) -> **UNAPPROVED**
   - Fact 8: Local Casablanca service agreement -> **UNAPPROVED**

3. **Enforced Platform Invariants**:
   - **Zero Invented Registrations**: Fictitious Ministry of Health (DMP) codes, CE marks, and FDA claims are absent from all catalog fixtures and metadata.
   - **Zero Clinical Superiority Claims**: Public descriptions contain no guaranteed therapeutic claims or cure promises.
   - **Mandatory Patient Disclaimers**: Equipment guides and diagnostic tool PDPs include statutory patient notices.

---

## 2. Automated Test Verification Results

All client-specific and cross-cutting UAT contract suites were executed from the authoritative checkout:

### 2.1 ParaLoca Client Contract Suite
- **Command:** `node node_modules/tsx/dist/cli.mjs --test clients/paraloca/*.test.ts`
- **Result:** **19 / 19 tests passed, 0 failures (exit 0)**
  - `brand-schema.test.ts` (4 tests): Owned vs partner brand classification, story metadata validation, price/SKU field preservation.
  - `content-approval.test.ts` (4 tests): Mandatory regulated product notices, absence of prohibited marketing claims, Law 84-12 framework compliance.
  - `client-profile.test.ts` (7 tests): ClientProfileSchema validation, approved brand spelling, Moroccan MAD currency, certified COD payment gateway, customer accounts permanently disabled, backend credentials scrubbing.
  - `rfq-policy.test.ts` (4 tests): Default non-destructive stock reservation, fail-closed policy validation, alignment with profile capabilities.

### 2.2 Full Workspace Regression
- **Command:** `node ./node_modules/vitest/vitest.mjs run`
- **Result:** **66 test files passed, 593 tests passed, 0 failures (exit 0)**.

### 2.3 Storefront & Package Typechecks
- **Command:** `node ./apps/storefront/node_modules/typescript/bin/tsc --noEmit -p ./apps/storefront/tsconfig.json`
- **Result:** **0 errors (exit 0)**.

---

## 3. UAT Synthesis & Operational Findings

The full User Acceptance Testing synthesis is published in:
[`docs/ecomos/release/PARALOCA_UAT.md`](../release/PARALOCA_UAT.md)

Key findings confirmed:
1. **Responsive Viewports**: Operable on desktop (1440px) and small mobile devices (375px), maintaining 44px touch targets on all primary interactive buttons.
2. **Guest Consumer Journeys**: Shopping cart operates with authoritative Store API reconciliation and Cash-on-Delivery payment processing in Moroccan Dirhams (MAD).
3. **Discreet Quotation (RFQ)**: Secondary professional quote entry points assemble multi-item baskets without intruding on consumer checkout. Quote tokens enforce 64-hex SHA-256 access checks, and disabling the RFQ addon fails closed with HTTP 404.
4. **Administrative Safety**: Scoped store manager permissions isolate platform configuration, and core WooCommerce tables are protected against destructive statements via `$wpdb->prefix`.

---

## 4. Release Decision: BLOCKED (Awaiting Authentic Owner Facts)

The technical deliverables of `ECO-1301` are complete, verified, and passing. However, in accordance with the project acceptance criteria:
> *"Missing owner facts keep client release BLOCKED even if engineering tasks pass."*

The ParaLoca client release remains **BLOCKED** from production cutover until the merchant owner supplies authenticated business disclosures and executes Section 4 of `clients/paraloca/content-approval.md`.
