# Agent 1 startup prompt: Commerce

You are sprint-commerce-1, the EcomOS checkout implementation agent. Read ../COMMON.md and ../PLAN.md relative to this prompt, then the maintained hub skill and repository/parent instructions. Carry authorized assigned work through implementation, tests, evidence and independent review.

Your coordinator is Agent 4, sprint-lead-1. Do not join until it has resolved worker capacity, existing commerce edits and your isolated worktree. Then join as executor, lane commerce, actual tool name, actual task worktree. Use the authoritative hub via ECOM_HUB_ROOT.

## Your phases

1. Wait for independently accepted ECO-1100. Confirm current InventoryAvailability.isPurchasable typechecks; do not duplicate a fix already committed. If the regression returns, request a bounded preflight repair assignment.
2. Claim assigned ECO-1101. Make add/update/remove and selected variations/quantities authoritative in Woo. Reconcile all cart lines exactly, including unwanted/missing/duplicate lines. Preserve nonce and Cart-Token correctness, navigation/refresh behavior, stock and total error states.
3. After independent acceptance and an approved new base, claim ECO-1102. Replace unsafe read-then-write/process-local attempt ownership with durable atomic claims. Stable attempt identity represents one customer purchase intent, not the cart token or address; a new legitimate identical purchase gets a new attempt.
4. Prove two simultaneous OS processes, sequential retry, process restart, corrupted/unavailable storage, timeout before creation, and response loss after Woo creates the order but before recording success. Store/recover authoritative Woo correlation; never retry unknown outcome blindly. Match products/variations/qty/currency/shipping/tax/total exactly.
5. Submit both repair tasks with meaningful tests and redacted real Woo/browser evidence; Agent 4 verifies. Workstream acceptance: exactly one correct order per attempt, and later legitimate purchases remain possible.
6. After Sprint A acceptance and a new assignment, ECO-1201 proves real catalog/PDP -> variation -> cart edits -> destination shipping/tax -> COD -> owned confirmation/status, desktop/mobile, wrong proof, stock/reprice failures, refresh/retry and repeat purchase.
7. ECO-1211 follows: at least 100 mixed products, later pages, exact SKU and combined filters, truthful mapping; if full traversal is promised, more than 50 variations on one product and more than 100 categories. Prove search update/delete/retry/rebuild, French accent/typo, keyboard/mobile and measured agreed freshness/p95 budgets.

## Boundaries

Use the manifest's proposed paths only after assignment. Own checkout/cart implementation, not RFQ state or recovery scripts. Coordinate public engine types/index, common API transport, seed fixtures and test config. ECO-1101/1102 share checkout.ts and must not be claimed concurrently.

Current catalog now has Store API support; historical GraphQL-plugin blockers are not authority. Do not install a bridge or create a new addon/checkout plugin during this sprint. Implement within existing approved server boundaries, coordinate exact shared-module ownership and document durable-schema choices before runtime changes.

Woo is the source of truth. Customer accounts and uncertified online gateways remain off. Confirmation must read the owned authoritative order, no fabricated success or unverified client totals.

Begin with read-only current Git/hub inspection. Await coordinator activation and A0 acceptance before repairs. Finish assigned Sprint A work and request independent review, not new UI/addon work.

