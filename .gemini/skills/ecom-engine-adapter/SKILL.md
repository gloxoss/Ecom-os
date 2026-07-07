---
name: ecom-engine-adapter
description: Guide for implementing EcomEngine adapter methods. Use when building WC or Vendure adapters, adding new engine methods, or ensuring adapter compliance with the interface contract.
---

# EcomEngine Adapter Skill

## When to Use
- Implementing a new method on `WooCommerceEngine` or `VendureEngine`
- Adding a new method to the `EcomEngine` interface
- Debugging adapter contract violations

## Interface Contract

Every adapter MUST implement all methods of `EcomEngine` from `packages/ecom-engine/src/interface.ts`.

### Rules
1. **Return types must match exactly** — no engine-specific types leaking through
2. **Use mappers** — raw API responses must be mapped to Ecom OS types in a `mappers.ts` file
3. **Handle errors gracefully** — return `null` for missing entities, throw for infrastructure errors
4. **No engine-specific imports in UI** — only `@ecom-os/engine` is allowed in `features/` and `components/`
5. **Money in minor units** — convert floats to cents at the adapter boundary

### File Structure Per Adapter
```
packages/engine-{name}/
├── src/
│   ├── client.ts      # Engine class implementing EcomEngine
│   ├── mappers.ts     # Raw API → Ecom OS type mappers
│   ├── products.ts    # Product-specific queries
│   ├── cart.ts        # Cart operations
│   ├── orders.ts      # Order operations
│   ├── auth.ts        # Authentication operations
│   └── index.ts       # Re-exports
├── package.json
└── tsconfig.json
```

### Testing
- Each adapter must pass the same integration test suite
- Swap `ECOM_ENGINE` env var and run tests against both adapters
- Mock the API client for unit tests, use real sandbox for integration tests

## Verification
```bash
pnpm --filter @ecom-os/engine-woocommerce typecheck
pnpm --filter @ecom-os/engine-vendure typecheck
```
