# ECO-602 Evidence: Authoritative Addon Off-State Verification Matrix

## Objective
Verify that disabled addons are completely inaccessible and inactive across frontend UI, API routes, staff capabilities, background jobs, and side effects.
Ensure that disabling a feature is an impenetrable server-side boundary, not cosmetic UI hiding.

---

## 1. Off-State Verification Ledger

| Target / Interface | Tested Addon | State | Action / Request | Expected Status | Observed Status | Side Effects Executed |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **API Route** | `quotes` | Disabled | `POST /api/quotes` | HTTP 404 (Not Found) | 404 ADDON_DISABLED | **0 (Zero writes, zero emails)** |
| **API Route** | `quotes` | Disabled | `POST /api/quotes` *(with forged `X-Override`)* | HTTP 404 (Not Found) | 404 ADDON_DISABLED | **0 (Zero writes, zero emails)** |
| **UI Route Guard** | `quotes` | Disabled | Direct browser navigation | Render 404 Not Found | 404 Rendered | **None** |
| **Operations Landing** | `quotes` | Disabled | Load `admin.php?page=ecomos-operations` | Slot omitted from DOM | Slot suppressed | **None** |
| **Staff Capabilities** | `quotes` | Disabled | Check `ecomos_check_permission('quotes')` | `false` | `false` | **None** |
| **API Route** | `quotes` | Enabled | `POST /api/quotes` | HTTP 200 (OK) | 200 OK | **Authorized side effects run** |
| **Unknown Service** | `nonexistent` | N/A | `GET /api/nonexistent` | HTTP 404 (Not Found) | 404 Not Found | **0** |

---

## 2. Security Invariants Verified

1. **Zero Side Effects in Off-State**:
   - `apps/storefront/src/__tests__/security/addon-off.test.ts` asserts that mock database transactions and email dispatch callbacks are never called when an addon route is guarded and disabled.
2. **Immunity to Client-Side Forgery**:
   - Client requests cannot manipulate feature enablement via URL query params (`?feature=quotes`), custom headers (`x-ecomos-feature-override`), or cookies.
   - The server resolves capabilities exclusively from the authoritative `AddonRegistry`.
3. **Fail-Closed Default**:
   - Registered addons initialize in an explicit disabled state (`enabled === false`).
   - Addons only transition to active after explicit configuration and compatibility validation.
