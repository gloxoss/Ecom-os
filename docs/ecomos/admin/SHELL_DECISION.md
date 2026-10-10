# EcomOS Admin Shell Evaluation & Architecture Decision

## Context & Objectives
Merchant operators require an intuitive, low-friction back-office environment for managing daily store activities (orders, fulfillment, catalog, stock, promotions, content).
Third-party WordPress admin enhancement suites (such as WP Adminify, uiXpress, and White Label CMS) are often proposed to modernize or white-label the classic WordPress dashboard.

This document records the architectural evaluation of candidate admin management approaches against strict operational constraints:
1. High-Performance Order Storage (HPOS) compatibility
2. Mobile & keyboard accessibility (WCAG AA)
3. Licensing & vendor lock-in
4. Update conflict footprint & maintainability
5. Rollback safety and performance overhead

---

## Candidate Options Evaluated

### Option 1: Full Commercial Admin Suite (e.g., WP Adminify / uiXpress)
- **Architecture**: Injects custom Vue/React shells over the entire `/wp-admin` layout, replacing menus, admin bars, and notices with custom DOM hierarchies.
- **Licensing**: Freemium core with commercial pro licenses; requires external license validation servers or SaaS telemetry.
- **HPOS Compatibility**: High risk. Frequently breaks React-based WooCommerce Admin components (WooCommerce Analytics, HPOS custom action buttons, order modal flyouts) due to DOM node hijacking and conflicting CSS resets.
- **Performance & Footprint**: Heavy asset payload (~2.5MB extra JS/CSS per admin request), increases page load times on low-latency mobile connections.
- **Update Fragility**: High. Core WordPress and WooCommerce releases frequently introduce breaking markup changes to the admin shell.

### Option 2: Menu Customizer & Dashboard Rebrander (e.g., White Label CMS)
- **Architecture**: Hooks into standard WP action hooks (`admin_menu`, `admin_head`) to selectively hide menu nodes, insert custom dashboard widgets, and inject logo assets.
- **Licensing**: Free GPLv2 plugin.
- **HPOS Compatibility**: Compatible, as it does not replace the internal screens or modify Woo order tables.
- **Limitations**: Only provides cosmetic hiding (client-side CSS and menu unsetting); does not provide server-side capability enforcement or tailor-made workflow queues (order triage, low-stock batches, RFQ quote queues).

### Option 3 (Selected): Native WordPress Core + Lean `wp-ecomos-operations` Extension
- **Architecture**: Reuses standard WordPress 6.x admin chrome and WooCommerce HPOS screens, paired with a custom, zero-dependency operational landing page and server-side capability isolation (`wp-ecomos-operations`).
- **Licensing**: 100% Free & Open Source (GPLv2 compatible), zero third-party licensing fees, zero telemetry.
- **HPOS Compatibility**: 100% native. Fully utilizes `Automattic\WooCommerce\Internal\DataStores\Orders\OrdersTableDataStore` without DOM conflict.
- **Accessibility & Mobile**: Native responsive layout with keyboard accessibility and ARIA landmarks conforming to WordPress Core standards.
- **Maintenance & Upgrades**: Zero upgrade friction. Inherits continuous upstream maintenance and security patches directly from WordPress core and WooCommerce.
- **Competing Shell Rule**: Strictly prohibits stacking multiple admin-shell plugins.

---

## Decision Matrix

| Evaluation Criterion | Option 1: WP Adminify / uiXpress | Option 2: White Label CMS | Option 3: Native + `wp-ecomos-operations` (Selected) |
| :--- | :--- | :--- | :--- |
| **HPOS Compatibility** | High conflict risk (DOM hijacking) | Pass (passive menu filters) | **Native / Certified (Zero conflict)** |
| **WooCommerce Admin React UI** | Unstable / visual breakage | Compatible | **100% Compatible** |
| **Licensing & TCO** | Paid commercial / renewal cost | Free GPLv2 | **Free GPLv2 (Zero ongoing cost)** |
| **Mobile & Keyboard Nav** | Inconsistent custom widgets | Standard WP | **WCAG AA standard WP keyboard support** |
| **Performance Overhead** | +2.5 MB JS/CSS, slows TTFB | Minimal (<50 KB) | **Near zero overhead (<25 KB CSS/JS)** |
| **Upgrade Safety** | Fragile across WP/Woo updates | Stable | **Rock solid across all WP/Woo minors** |
| **Rollback Simplicity** | Complex (database option residue) | Clean | **Instantaneous deactivation / zero residue** |

---

## Architectural Decision: AD-502

1. **Adopt Option 3 (Native WP + `wp-ecomos-operations`)** as the standard back-office architecture for EcomOS.
2. **Prohibit Stacking Competing Admin Shells**: No third-party admin overhaul suites shall be installed or activated alongside `wp-ecomos-operations`.
3. **Server-Enforced Role Scoping**: Navigation streamlining is paired with strict server-side capability gating (as implemented in `ECO-501`), ensuring that cosmetic menu simplicity reflects true backend authorization.
4. **Operations Landing**: Dedicated operational triage (order queue, inventory alerts, quick actions) is delivered via a focused, lightweight top-level menu page (`admin.php?page=ecomos-operations`).
