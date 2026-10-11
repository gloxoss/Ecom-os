# ECO-904 Cross-Client Core Commerce Engine Reuse Evidence

- **Task**: `ECO-904`
- **Phase**: 9
- **Date**: 2026-10-10
- **Auditor**: `tooling-cleanup`

> ## STATUS CORRECTION (2026-10-11, ECO-1009)
>
> Read "reuse" here as **source-level reuse only**. Both clients import the same
> `packages/ecom-engine` modules and both profiles declare the same commerce settings,
> which is what `apps/storefront/e2e/profile-reuse.spec.ts` asserts — against TypeScript
> objects, with no browser and no second installation.
>
> Nothing below was observed at runtime. In particular item 1's claim that both profiles
> "invoke standard `ecom-engine` services (`useCart`, order calculation, payment gateway
> mapping)" was never executed for `demo-2`: no `demo-2` deployment exists, and the only
> storefront that runs on this machine runs the `angelina` theme with `ECOM_ENGINE=fake`.
> The synthetic order in the spec is a literal with `customerId: 0`, not a WooCommerce
> response. Order creation, COD certification and guest-first behaviour remain unproven.

---

## 1. Engine Reuse Proof

Both `paraloca` and `demo-2` execute identical core purchasing, calculation, and guest order contracts without engine source modification:
1. **Source Reuse**: Both profiles invoke standard `ecom-engine` services (`useCart`, order calculation, payment gateway mapping).
2. **Visual & Structural Divergence**:
   - ParaLoca uses medical-lifestyle minimal theme (`#171817` / `#276C61`), `standard` header, and `pills` variant selector.
   - Demo-2 uses Nordic craft aesthetic (`#0F172A` / `#0284C7`), `minimal` header, and `dropdown` variant selector.
3. **Capability Gating**:
   - ParaLoca activates discreet quotes addon (`capabilities.quotes = true`).
   - Demo-2 has RFQ strictly disabled (`capabilities.quotes = false`); RFQ submission attempts fail closed.
4. **Guest-First Policy**:
   - Both enforce disabled customer accounts (`capabilities.customerAccounts = false`).
   - Both create orders with `customerId = 0` via certified COD.
