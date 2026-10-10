# ECO-701: RFQ State Machine and Permission Analysis

## 1. State Machine Verifications
The RFQ state machine (`packages/addons-rfq/src/state-machine.ts`) was subjected to automated boundary testing across 8 comprehensive scenarios:
- **Normal Flow**: Transitions from `draft` -> `submitted` -> `verified` -> `offer_created` -> `revised` -> `accepted` -> `converted`.
- **Actor Access Control**: Enforces that only operators/administrators can create or revise offers, while only verified guests can accept active offers.
- **Stale Revision Protection**: Proves that acceptance requests for older revisions (`rev_1`) fail when a newer revision (`rev_2`) is active.
- **Expiration Enforcement**: Blocks quote acceptance if the current timestamp exceeds `expiresAt`.
- **Illegal Transitions**: Proves that invalid state transitions (such as `draft` directly to `accepted`, or `submitted` directly to `converted`) throw `IllegalTransitionError`.

## 2. Policy and Invariant Verifications
The policy engine (`packages/addons-rfq/src/policy.ts`) was verified across 7 scenarios:
- **Zero Automatic Stock Reservation**: Validates that by default (`stockReservation = 'none'`), no inventory deduction is triggered upon quote creation or customer acceptance.
- **Data Retention & Purge**: Validates that quotes in terminal states (`rejected`, `expired`) become purge-eligible after the configured 365-day retention window, while converted orders remain archived.
- **Input Validation**: Verifies that empty baskets, non-positive quantities, and missing consent IDs are caught and rejected prior to submission.
