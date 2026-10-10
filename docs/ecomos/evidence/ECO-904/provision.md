# ECO-904 Demo Client 2 Provisioning & Environment Separation

- **Task**: `ECO-904`
- **Phase**: 9 (Release Readiness, Hardening & Final Launch Gate)
- **Client**: Nordic Craft Supplies (`demo-2`)
- **Status**: **PROVISIONED & ISOLATED**
- **Date**: 2026-10-10

---

## 1. Environment & Configuration Separation

Demo Client 2 is provisioned on separate tenant configuration without duplicating commerce engine source:
1. **Tenant ID**: `demo-2`
2. **Domain Origin**: `https://nordic-craft.example.com`
3. **Internal WordPress Origin**: `https://wp.nordic-craft.internal`
4. **Internal WooCommerce Origin**: `https://woo.nordic-craft.internal`
5. **Session & Encryption Secrets**: Independently minted 32-byte keys.
6. **Zero Data Reuse**: Does not share ParaLoca customer sessions, orders, or cart stores.
