# ECO-703: RFQ Idempotent Submission & Privacy Analysis

## 1. Idempotency Invariant & Replay Protection
- **Header & Payload Binding**: Submissions bind client-generated `idempotencyKey` passed via `Idempotency-Key` HTTP header and payload body.
- **Deduplication Barrier**: Repeated or retried submissions with the same key return the cached 201 response with `X-Idempotent-Replay: true` and `idempotent: true`.
- **Zero Duplicate Side-Effects**: Prevents duplicate quote entities, duplicate staff email notifications, and duplicate access tokens on network hiccups.

## 2. Privacy & Data Protection (GDPR / CNDP)
- **Zero Customer Account Requirement**: Submitters are authenticated via cryptographically secure HMAC secrets (`accessSecretHash`) without creating WordPress accounts (`wp_users`).
- **No Public Cache / Logs Exposure**: All responses strictly set `Cache-Control: no-store, private`, preventing intermediate proxies from caching sensitive B2B/B2C contact details.
