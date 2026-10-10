# ECO-707 Evidence: Complete RFQ Disabled State Isolation

## 1. Architectural Overview & Off-State Isolation Matrix

ECO-707 proves that the EcomOS RFQ (Request for Quote / Devis) addon achieves complete isolation in its disabled (off) state across user interfaces, public capability projections, headless REST API endpoints, background side-effects, and standard purchasing cart workflows.

### Isolation Matrix

| Layer | Off-State Behavior | Verification Method |
|---|---|---|
| **Storefront Route Guard** | Intercepts `/devis` and returns HTTP 404 `ADDON_DISABLED`. | `guardAddonRoute('quotes')` in `apps/storefront/e2e/rfq-off.spec.ts` |
| **Capability Projection** | Public capability list omits `quotes` and `quote_builder`. UI navigation bars and CTAs conditionally unmount. | `hasAddonCapability('quotes') === false` in `addon-capabilities.ts` |
| **Headless REST API** | All endpoints (`/quotes`, `/offers`, `/accept`, `/reject`, `/revise`, `/document`, `/convert`) return HTTP 404 `addon_disabled`. | `ecomos_rfq_rest_check_active` callback in `routes.php` |
| **Background Emails** | Transactional email dispatchers suppress all email sends if addon is inactive. | `ecomos_rfq_send_email` check in `notifications.php` |
| **Order Conversion** | Background or automated order conversion blocked with HTTP 404 `addon_disabled`. | `ecomos_rfq_convert_quote_to_order` check in `conversion.php` |
| **Staff Offer Creation** | Operator offer creation and revision blocked with HTTP 404 `addon_disabled`. | `ecomos_rfq_create_staff_offer` check in `offers.php` |
| **Cart Domain Isolation** | Standard shopping cart and checkout operate identically whether RFQ is ON or OFF. Quote items never overwrite normal cart. | Cart totals and isolation assertions in `rfq-off.spec.ts` |

---

## 2. Dual Cart Domain Invariant

- **Store Separation**: Standard purchasing relies exclusively on `cart-storage` (WooCommerce cart session), whereas RFQ basket manipulation operates in `quote-storage` (`QuoteBasket`).
- **No Shared Mutation**: Operations such as adding quotation items, clearing the quote basket, or accepting an offer revision have zero impact on standard shopping cart items, line items, or order checkout totals.
- **Reversible Activation**: Enabling the addon via `registry.enable('quotes')` immediately restores capability projection and route access without requiring database schema rebuilds or service reboots. Disabling the addon returns the system to clean 404 isolation.
