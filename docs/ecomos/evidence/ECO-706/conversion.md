# ECO-706 Evidence: Optional Idempotent Quote-to-Order Conversion

## 1. Architectural Design & Invariants

ECO-706 implements the idempotent conversion of accepted quotations into native WooCommerce orders (HPOS compatible) with cross-audit references and configurable stock reservation.

### Core Architectural Invariants Enforced:
1. **Strict Acceptance Precondition**:
   - Only quotes in the `accepted` state can be converted to orders.
   - Attempts to convert quotes in `submitted`, `offer_created`, `rejected`, or `expired` states are blocked at the capability and API level with HTTP 400 `invalid_conversion_state`.

2. **Idempotency & Duplicate Prevention**:
   - Once a quote is converted, its record in `wp_ecomos_rfq_quotes` permanently records `converted_order_id` and transitions to `converted_to_order`.
   - Repeated, concurrent, or replayed conversion calls detect the existing `converted_order_id` and return the existing order reference with `isDuplicate: true`, guaranteeing that no duplicate WooCommerce order is ever minted.

3. **Bidirectional Cross-Audit References**:
   - The created WooCommerce order contains immutable metadata references:
     - `_ecomos_rfq_quote_id`: Unique UUID of the source quote.
     - `_ecomos_rfq_quote_number`: Human-readable reference (e.g. `DEV-2026-1001`).
     - `_ecomos_rfq_revision_id`: The exact accepted revision ID (e.g. `rev_2`).
     - `_ecomos_conversion_timestamp`: ISO 8601 UTC timestamp of conversion.
     - `_billing_tax_id`: Customer's fiscal registration / ICE / VAT number.
   - The quote table simultaneously links `converted_order_id`, providing an unbroken audit trail for accountants and warehouse operators.

4. **Honest Stock Reservation Policy**:
   - By default (`ecomos_rfq_stock_reservation = 'none'`), quotation emission, negotiation, and acceptance do not lock physical WooCommerce stock.
   - The created order is set to `pending` status.
   - Stock reduction occurs when payment is confirmed or when explicitly authorized by merchant policy (`stock_reservation = 'on_acceptance'`).

5. **HPOS & Native WooCommerce Compatibility**:
   - Order creation leverages standard WooCommerce APIs (`wc_create_order()`, `WC_Order` CRUD), fully supporting High-Performance Order Storage (HPOS / Custom Order Tables) without modifying deprecated post tables.

---

## 2. API Endpoints

- `POST /wp-json/ecomos/v1/rfq/quotes/{id}/convert`:
  - Protected by `ecomos_rfq_rest_check_read_permission` (verified guest with `x-quote-token` or authenticated staff operator).
  - Invokes `ecomos_rfq_convert_quote_to_order($quote_id, $options)`.
  - Emits WordPress action `ecomos_rfq_quote_converted`.
