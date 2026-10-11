# ECO-1103 — RFQ Guest Token / Staff Credential Decoupling & Honest Error Propagation

**Commit:** `f3efb53` · **Agent:** `sprint-rfq-1` · **Lane:** `commerce` · **Base commit:** `89c4482`

## Defects Identified & Addressed

| # | Defect | Location | Security Impact |
| --- | --- | --- | --- |
| 1 | Staff service credentials on backend transport could authorize guest routes presenting invalid/forged guest tokens | `plugins/wp-ecomos-rfq/routes.php`, `documents.php` | Privilege conflation: privileged server keys substituted for guest proof |
| 2 | Accept and revise endpoints permitted staff operator capability bypass instead of enforcing guest ownership token | `plugins/wp-ecomos-rfq/routes.php` | Authorization bypass: staff session or transport credentials could act on guest behalf |
| 3 | Storefront BFF skipped token check if `quote.accessSecretHash` was absent | `apps/storefront/src/app/api/rfq/offers/route.ts` | Complete bypass: remote WordPress store scrubbed hashes, resulting in unauthenticated offer reads/actions |
| 4 | Storefront POST `/api/rfq/offers` called `store.getQuote(quoteId)` without forwarding guest access token | `apps/storefront/src/app/api/rfq/offers/route.ts` | Upstream auth failure: WordPress guest endpoint requires token, resulting in unauthenticated upstream calls |
| 5 | Failed upstream writes/reads swallowed or masked as generic errors; failed submissions cached in idempotency | `apps/storefront/src/app/api/rfq/route.ts`, `server-quote-store.ts` | Data corruption: false 201/200 reports or cached failed state poisoning subsequent idempotency replays |

## Security & Architecture Repairs

1. **Guest Proof Decoupled from Staff Capability**:
   - In `plugins/wp-ecomos-rfq/routes.php`:
     - `ecomos_rfq_rest_check_read_permission`: Validates `$token` first via `ecomos_rfq_verify_guest_access`. If token is provided but forged/invalid, returns HTTP 403 `forbidden` unconditionally. Staff capability check only applies when no guest token is presented (for staff portal inspection).
     - `ecomos_rfq_rest_check_accept_permission`: Exclusively guest operation. Requires valid guest token; returns 401 if missing and 403 if invalid. Staff service credentials cannot bypass or excuse missing guest tokens.
     - `ecomos_rfq_rest_check_revise_permission`: Exclusively guest operation. Requires valid guest token; returns 401 if missing and 403 if invalid.
     - `ecomos_rfq_rest_check_reject_permission`: If token is provided, validates guest token (403 on forged token). If no token provided, requires real staff capability.
     - `ecomos_rfq_rest_check_document_permission` & `documents.php`: Validates guest token first; forged tokens fail with 403 without falling back to staff capability.
2. **BFF Token Enforcement & Secure Mapping**:
   - In `apps/storefront/src/app/api/rfq/offers/route.ts`:
     - Token check is mandatory before accessing store.
     - Forward guest token to `store.getQuote(quoteId, token)`.
     - In both GET and POST, enforce token hash comparison if `quote.accessSecretHash` is known.
     - Never expose `accessSecretHash` in client responses.
3. **Honest Upstream Error Propagation & Resilience**:
   - In `apps/storefront/src/features/rfq/model/server-quote-store.ts`:
     - Introduced `UpstreamRfqError` carrying exact HTTP status code and machine error code.
     - Maps network failures to HTTP 502 `UPSTREAM_NETWORK_ERROR`.
     - Maps timeouts to HTTP 504 `UPSTREAM_TIMEOUT`.
     - Rejects empty responses and malformed non-JSON payloads with HTTP 502 `UPSTREAM_EMPTY_RESPONSE` / `UPSTREAM_MALFORMED_RESPONSE`.
     - Preserves upstream error codes and status (e.g. 409 `STALE_REVISION`, 410 `QUOTE_EXPIRED`, 403 `FORBIDDEN`).
   - In `apps/storefront/src/app/api/rfq/route.ts`:
     - Wraps `store.putQuote()` in try/catch and propagates status/errors honestly.
     - Prevents caching failed attempts in the idempotency store.
4. **Idempotency Replay & Owner Binding**:
   - Verified that idempotency keys are bound to the submitter's normalized email address.
   - Replaying with the same key and same owner returns cached 201 with `X-Idempotent-Replay: true`.
   - Replaying with the same key from a different owner fails closed with HTTP 409 `IDEMPOTENCY_OWNER_MISMATCH`.

## Attack Test Matrix (`sprint-a-rfq-auth.test.ts`)

| Scenario | Input / Attack Vector | Expected Status | Result |
| --- | --- | --- | --- |
| Initial guest creation | Valid guest submission | 201 Created | PASS |
| Guest read without token | Missing `x-quote-token` header | 401 Unauthorized | PASS |
| Guest read with forged token | Random 64-char hex token | 403 Forbidden | PASS |
| Cross-quote token attack | Valid token from Quote A presented to Quote B | 403 Forbidden | PASS |
| Guest actions without token | Accept/Reject/Revise with no `accessSecret` | 400 Bad Request | PASS |
| Guest actions with forged token | Accept/Reject/Revise with forged `accessSecret` | 403 Forbidden | PASS |
| Staff transport with missing guest token | Staff Basic Auth on transport, no guest token | 401 Unauthorized | PASS |
| Staff transport with forged guest token | Staff Basic Auth on transport, forged guest token | 403 Forbidden | PASS |
| Upstream 500 error propagation | Upstream database error on `putQuote` | 500 / no idemp cache | PASS |
| Upstream timeout propagation | Abort timeout during upstream fetch | 504 UPSTREAM_TIMEOUT | PASS |
| Upstream network drop | Connection refused / socket drop | 502 UPSTREAM_NETWORK_ERROR | PASS |
| Upstream malformed / empty body | Non-JSON HTML / empty body | 502 UPSTREAM_MALFORMED_RESPONSE | PASS |
| Upstream state machine error | Accept on expired offer / stale revision | 410 QUOTE_EXPIRED / 409 STALE_REVISION | PASS |
| Idempotency owner hijacking | Same idempotency key from different email | 409 IDEMPOTENCY_OWNER_MISMATCH | PASS |

## Verification Results

- `node --test plugins/wp-ecomos-rfq/tests/*.spec.mjs`: **11/11 tests pass** (exit code 0).
- `vitest run "sprint-a-rfq-auth"`: **14/14 tests pass** (exit code 0).
- `vitest run` (workspace full test suite): **535/535 tests pass across 63 files** (exit code 0).
