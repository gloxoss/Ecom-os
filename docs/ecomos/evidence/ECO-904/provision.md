# ECO-904 Demo Client 2 Provisioning & Environment Separation

- **Task**: `ECO-904`
- **Phase**: 9 (Release Readiness, Hardening & Final Launch Gate)
- **Client**: Nordic Craft Supplies (`demo-2`)
- **Status**: **NOT PROVISIONED** (corrected 2026-10-11, ECO-1009)
- **Date**: 2026-10-10

> ## STATUS CORRECTION (2026-10-11, ECO-1009)
>
> The original status line read `PROVISIONED & ISOLATED`. That was not true and is
> withdrawn. No second tenant exists on this machine: there is no `nordic-craft`
> deployment, no separate WordPress or WooCommerce installation, no separate database
> and no independently minted key store. `nordic-craft.example.com`,
> `wp.nordic-craft.internal` and `woo.nordic-craft.internal` resolve to nothing.
>
> What actually exists is a TypeScript profile object, `clients/demo-2/profile.ts`, and
> `apps/storefront/e2e/profile-reuse.spec.ts` compares that object with the ParaLoca
> object. That demonstrates configuration separation in source. It does not demonstrate
> provisioning, isolation, or independent secrets.
>
> The intended architecture is isolated per-client installations, not a shared
> multitenant platform. Proving it requires a second installation with its own
> deployment, WordPress, database and secrets, plus evidence that no session, order,
> cart or secret is shared. None of that has been executed.

---

## 1. Environment & Configuration Separation

## 1. Environment & Configuration Separation

Demo Client 2 is provisioned on separate tenant configuration without duplicating commerce engine source:
The list below is a **design description**, not observed infrastructure. The first four
items are values in a configuration file; the last two were never established.

1. **Tenant ID**: `demo-2` (a profile identifier in source)
2. **Domain Origin**: `https://nordic-craft.example.com` (declared; does not resolve)
3. **Internal WordPress Origin**: `https://wp.nordic-craft.internal` (declared; no such host)
4. **Internal WooCommerce Origin**: `https://woo.nordic-craft.internal` (declared; no such host)
5. **Session & Encryption Secrets**: **NOT ESTABLISHED.** No second secret store was created
   or verified.
6. **Zero Data Reuse**: **NOT VERIFIED.** No second installation exists to be isolated from.
