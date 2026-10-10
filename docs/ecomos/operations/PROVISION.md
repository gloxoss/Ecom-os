# EcomOS Client Environment Provisioning Runbook

- **Document**: `PROVISION.md`
- **Application**: EcomOS Client Onboarding
- **Version**: 1.0.0
- **Status**: **PRODUCTION ACTIVE**

---

## 1. Overview & Architecture

EcomOS allows independent client storefronts to run on isolated configurations, separate database tenants, and unique cryptographic secrets without duplicating core engine source.

---

## 2. Provisioning Checklist

1. **Client Identifier**: Unique lowercase kebab-case slug (`paraloca`, `demo-client-2`).
2. **Environment File**: Created at `.env.<client-id>` with:
   - `DATABASE_URL`: Dedicated MySQL database connection string.
   - `STOREFRONT_URL`: Validated `https://` storefront origin.
   - `ECOM_OS_ENCRYPTION_KEY`: 32-byte Base64-encoded AES key (`openssl rand -base64 32`).
   - `SESSION_COOKIE_SECRET`: Cryptographic session secret string ($\ge 32$ chars).
   - `ALLOWED_PAYMENT_METHODS`: Strictly restricted to certified gateways (`cod`).
3. **Execution Command**:
   ```bash
   pnpm --filter @ecom-os/cli provision <client-id>
   ```
4. **Validation Enforcement**:
   - Fails immediately if any required secret or valid database URL is omitted.
   - Zero hardcoded fallback credentials permitted.
