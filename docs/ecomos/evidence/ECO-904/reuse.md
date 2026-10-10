# ECO-904 Cross-Client Core Commerce Engine Reuse Evidence

- **Task**: `ECO-904`
- **Phase**: 9
- **Date**: 2026-10-10
- **Auditor**: `tooling-cleanup`

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
