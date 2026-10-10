# ECO-205: Payment Provider Capability Contract & Fail-Closed Gateways Report

## Identity and scope

- Executor: `commerce-cleanup`, commerce lane.
- Assignment base: `916b2621cf8199866ee664d869cdb0537516cc0f`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `packages/addons-multi-payment/src/interface.ts`, `packages/addons-multi-payment/src/registry.ts`, `packages/addons-multi-payment/src/__tests__/provider-capabilities.test.ts`, `docs/ecomos/evidence/ECO-205/report.md`.
- Resources: `git-index`.
- Date: 2026-10-10.

## Workflow and source of truth

1. **Certified Cash on Delivery Core:**
   - COD is the native, verified payment method for ParaLoca.
   - `CodGateway` is automatically registered by default in `packages/addons-multi-payment/src/registry.ts`.
   - `isGatewayCertified('cod')` returns `true`.
   - Initiation logs a structured merchant notification event and returns a `{ type: 'pending' }` status message without requiring third-party redirects or client card inputs.

2. **Fail-Closed Online Provider Governance:**
   - Per architecture decision and Phase 0/2 security guidelines, online payment gateways (`stripe`, `cmi`) require provider-specific sandbox certification and explicit owner authorization before activation.
   - `registerGateway` strictly rejects any provider with `id !== 'cod'`, preventing speculative activation.
   - `getGateway` returns `undefined` for uncertified providers.
   - `getEnabledGateways()` enforces an allowlist that strips uncertified providers even if specified in `process.env.PAYMENT_PROVIDERS`.
   - Direct provider entry points (`StripeGateway.initiate`, `CmiGateway.initiate`) throw explicit descriptive errors.
   - Direct webhook endpoints (`/api/webhooks/stripe`, `/api/webhooks/cmi`) return 404 Not Found to prevent forged payment events.

3. **Event Ledger & Order Integrity:**
   - No payment status transition to 'paid' can occur without cryptographically validated provider callback proof.
   - COD order statuses remain 'processing' or 'pending' pending delivery confirmation.

## Changed behavior and files

- `packages/addons-multi-payment/src/interface.ts`:
  - Added `PaymentCapability` interface defining certification flags, refund support, redirect requirements, and webhook verification schemes.
- `packages/addons-multi-payment/src/registry.ts`:
  - Automatically registered `CodGateway` by default.
  - Implemented `isGatewayCertified(id)` helper.
  - Enforced fail-closed filtering in `getEnabledGateways()` and `registerGateway()`.
- `packages/addons-multi-payment/src/__tests__/provider-capabilities.test.ts`:
  - Created test suite (8 tests) verifying COD certification and negative fail-closed behavior for uncertified online providers.

## Verification and test results

- **Provider Capability Tests:**
  - `pnpm test packages/addons-multi-payment/src/__tests__/provider-capabilities.test.ts`: PASS (8 tests).
- **Workspace Unit Tests:**
  - `pnpm test`: PASS (25 test files, 222 unit tests).
- **TypeScript Check:**
  - `pnpm typecheck`: PASS (11 workspace packages clean).
- **Storefront Lint:**
  - `pnpm -C apps/storefront lint`: PASS (0 errors).

## Honest Boundaries

- `ECO-205` certifies COD as the active release provider and establishes the fail-closed capability boundary for deferred online gateways.
- Guest order ownership verification and status lookup are implemented in `ECO-206`.
