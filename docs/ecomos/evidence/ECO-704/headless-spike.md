# ECO-704: Headless RFQ REST API Spike & Plugin Evaluation

## 1. Headless Endpoint Spike & Verification
We evaluated the REST API contracts required for headless Next.js operation:
- `POST /wp-json/ecomos/v1/rfq/quotes`: Guest submit endpoint with HMAC access secret generation.
- `GET /wp-json/ecomos/v1/rfq/quotes/{id}`: Guest read with token verification or staff read with `ecomos_operator` capability.
- `POST /wp-json/ecomos/v1/rfq/quotes/{id}/offers`: Staff pricing offer generation (Revision snapshot).
- `POST /wp-json/ecomos/v1/rfq/quotes/{id}/accept`: Guest acceptance of active revision.
- `POST /wp-json/ecomos/v1/rfq/quotes/{id}/reject`: Guest or staff cancellation.

## 2. Evaluation Findings
Off-the-shelf shortcode-centric plugins fail our automated headless evaluation:
1. Shortcode plugins rely on `$_SESSION` and `WC()->cart`, causing state clash with standard checkout.
2. They do not maintain an immutable revision ledger; when a merchant amends a price, previous quotes are permanently lost.
3. They require user authentication or expose customer PII on insecure URLs.

Conclusion: The custom companion plugin `wp-ecomos-rfq` is mandatory to satisfy the headless and immutable revision requirements.
