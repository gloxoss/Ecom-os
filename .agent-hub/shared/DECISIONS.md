# EcomOS decision ledger

Settled owner choices are listed below so agents do not re-ask them. Dates reflect the current recorded session, 2026-10-09. This ledger is not a substitute for explicit authorization of a consequential action.

## Settled product and architecture decisions

### D-001: reusable EcomOS before client-specific delivery

Source: owner master prompt and start document. Build the existing platform incrementally; preserve `EcomEngine`, Woo adapter, themes/config and addon seams. ParaLoca is one client, not the core identity. No wholesale platform replacement or shared SaaS tenancy. Separate deployments/WP/database/secrets per client.

### D-002: guest-first core; customer accounts optional and off

Source: master prompt and reporting contract. Buying and RFQ require no registration. Unsafe account paths stay disabled until an independently verified addon exists. Staff authentication/capabilities remain mandatory. No task may change this policy without owner approval.

### D-003: WooCommerce is the commercial authority

Source: master prompt and modular architecture. Woo owns price, tax, stock, shipping, orders and payment state. Next.js/BFF/engine mediate safe presentation and commands. Prefer Store API cart/checkout after compatibility proof; catalog/CMS may use tested REST/GraphQL. No browser totals or hub state as commercial authority.

### D-004: merchant administration stays native/hybrid

Source: master prompt and admin strategy. Use simplified WordPress/Woo admin plus a small role-scoped EcomOS Operations complement. No parallel Next merchant application unless a real unmet requirement and architecture decision justify it. Admin-shell selection remains open.

### D-005: ParaLoca is a configured profile

Source: master prompt. Brand spelling ParaLoca; French-first/MAD/Morocco; owned brands within one B2C catalog. Medical metadata/docs and legal claims require client-specific verified content. `paraloca.ma` is intended domain, not authorization for DNS/cutover. Coming Soon is independent.

### D-006: RFQ/devis is optional and isolated

Source: master prompt/architecture. Separate quote basket, guest submission, immutable offers, protected access and optional order conversion. `/devis` and product secondary action share it. Search is reusable; normal cart remains independent. Implement after stable core/addon prerequisites. Plugin versus custom backend is not yet selected.

## Recorded execution decisions

### D-007: containment rather than unverified success

Recorded in Phase 0 report. Unsafe identity, Stripe/CMI and legacy order/payment writes are disabled. This removes known exposure without claiming those features are implemented. Keep unavailable UI/direct-call rejection until acceptance, including ownership-safe confirmation. Do not reenable by an environment flag alone.

### D-008: isolated local staging and three plugin installations approved

Owner supplied `paraloca.local` and explicitly approved installation on the local site of WooCommerce 11.2.1, WPGraphQL 2.23.1 and WPGraphQL for eCommerce 1.0.3. Backups and setup evidence are in `docs/ecomos/STAGING_SETUP.md`. Approval scope excludes production, other plugins, paid licenses and destructive migrations. Optional project PHP plugins remain inactive pending tests.

### D-009: local fixture commerce is synthetic

Recorded at `148e913`. Backend COD order 15 and 202.84 MAD total prove the local Store API smoke and sequential retry behavior. 25.00 MAD shipping and 10% fixture tax are deliberately synthetic. No merchant shipping/tax policy or live payment was approved by this test. Concurrent duplicate protection/front-end confirmation still need implementation/evidence.

### D-010: preserve phase sequencing

Recorded handoff alignment `6541de1`. Phase 0 backend proof does not complete Phase 2. Remaining Phase 0 gates must be addressed/recorded; Phase 1 catalog contracts/query/variation cleanup precedes full storefront checkout. Do not mark the whole platform clean because tests/build passed.

### D-011: build a project-local multi-agent coordination hub

Latest owner request: use IMC/SchoolOS examples to coordinate many agents and make EcomOS work faster. Hub work may define roles, file ownership, task lifecycle, verification and business guardrails. It orchestrates engineering; it does not replace Woo authority or grant production/plugin/payment permissions. Preserve existing source and dirty user work.

## Open decisions, not blockers for all local work

- Search provider: compare repaired native Woo, Meilisearch and Typesense against public indexing/API/sync/operations needs. No provider purchase or arbitrary latency/freshness SLA has been selected.
- Guest cart/BFF contract: select secure session/CSRF/expiry/recovery and concurrency strategy after reviewing the proved local Store API behavior. The smoke script is not the implementation.
- Gateway: merchant eligibility/contract, sandbox, successful callback semantics and supported headless checkout must be verified before any online provider is enabled.
- Shipping/tax: owner-approved merchant destinations, rates, tax treatment and rounding/display policy. Synthetic fixture settings cannot answer this.
- RFQ backend: choose a compatible existing plugin only after complete headless lifecycle/private access/variation/revision/conversion proof; otherwise isolate a custom addon. Contact/grant/expiry/retention policy still needs design.
- Admin enhancement, email delivery and optional paid integrations: document license/cost/maintenance/HPOS/API fit and replacement strategy; seek applicable authorization before operational changes.
- Medical content/legal classification, privacy policy and approved claims: obtain real owner-provided facts. Do not generate certifications or substitute speculative claims.
- Release: second-client proof, provider certification, restore rehearsal, environment readiness and owner-approved production/cutover plan are outstanding.

## Recording a new decision

Append a stable ID, date, question/scope, decision status (`proposed`, `accepted`, `superseded`), exact source of owner authorization when needed, rationale, affected contracts/tasks, evidence and reversal consequences. A technical agent proposal is `proposed`, not owner approval. Keep superseded entries and reference the replacement. Never copy credentials or private business/customer records into the ledger.
