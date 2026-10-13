# Client shells

Optional per-client storefront overrides. Leave this folder empty in the starter.

A client instance adds `<client-id>.tsx` here (the id is the value of `ECOM_CLIENT_PROFILE`) exporting exactly one constant named `<name>Shell`, typed `ClientShellOverrides` from `@/lib/client-shell`:

```tsx
import type { ClientShellOverrides } from '@/lib/client-shell';

export const acmeShell: ClientShellOverrides = {
  htmlLang: 'fr',
  Header: AcmeHeader,
  Footer: AcmeFooter,
  Landing: AcmeHome,
};
```

Run `node scripts/generate-clients.mjs` (done by `predev` and `prebuild`) to register it. Every override is optional; omitted ones use the default EcomOS storefront. Keep client content here, never in the shared header, footer or landing components.
