# Screen Inventory — Ecom OS

Every storefront screen, its route, every state, its key components, and where it's linked from. A developer should be able to scaffold the whole storefront from this table without asking questions.

States covered for each interactive screen: **empty** (no data), **loading** (skeleton), **error** (engine/network failure), **success** (default render), plus screen-specific edge cases.

---

## 1. Home & Marketing

| # | Screen | Route | States | Key Components | Linked From |
|---|---|---|---|---|---|
| S-01 | Home | `/{locale}` | success · empty (no featured products configured) · loading · error | `Hero` (from brand.config) · `FeaturedProductsRail` · `CategoryGrid` · `NewsletterBlock` · `BrandFooter` | Logo (everywhere); locale-switch fallback |
| S-02 | About | `/{locale}/about` | success (static content) · 404 if not configured | `StaticTemplate` · `RichTextBlock` · `TeamBlock` (optional) | Header nav · footer |
| S-03 | Contact | `/{locale}/contact` | success · form-submitting · form-success · form-error · validation-error | `ContactForm` (client island) · `ContactInfoBlock` · `MapEmbed` (optional) | Header nav · footer |

## 2. Catalog & PDP

| # | Screen | Route | States | Key Components | Linked From |
|---|---|---|---|---|---|
| S-10 | Catalog index | `/{locale}/catalog` | success · empty (no categories) · loading · error | `CategoryGrid` · `BreadcrumbBar` | Header nav · home |
| S-11 | Category page | `/{locale}/catalog/{slug}` | success · empty (no products) · loading · error · 404 (unknown slug) | `BreadcrumbBar` · `FilterSidebar` · `SortBar` · `ProductGrid` · `Pagination` · `ResultCount` | Catalog index · header mega-menu · footer |
| S-12 | Product detail (PDP) | `/{locale}/products/{slug}` | success · loading · error · 404 · out-of-stock · backorder · variant-required · variant-unavailable | `BreadcrumbBar` · `ProductGallery` · `VariantSelector` · `PriceBlock` · `StockBadge` · `AddToCartButton` (client) · `ProductTabs` (description / specs / shipping / returns) · `RelatedProductsRail` | Category page · search · related rails · external (Instagram) |
| S-13 | Search results | `/{locale}/search?q={query}` | success · empty (no results) · loading · query-too-short | `SearchInput` (client) · `ProductGrid` · `ResultCount` · `SuggestedQueries` | Header search icon |

## 3. Cart & Checkout

| # | Screen | Route | States | Key Components | Linked From |
|---|---|---|---|---|---|
| S-20 | Cart page | `/{locale}/cart` | success · empty · loading · stale (item out of stock since added) · error | `LineItemList` · `LineItemRow` (qty stepper, remove) · `CartSummary` · `CheckoutCTA` · `KeepShoppingLink` | Header cart icon · PDP add confirmation |
| S-21 | Cart drawer (overlay, not a route) | — | open · closed · empty · success · loading | `LineItemListCompact` · `MiniSummary` · `CheckoutCTA` | Triggered by Add-to-Cart |
| S-22 | Checkout — Address | `/{locale}/checkout/address` | success · loading · validation-error · network-error · guest-or-login choice | `AddressForm` (client) · `ContactInfoForm` · `GuestCheckoutToggle` · `StepNav` (1 of 3) · `OrderSummarySidebar` | Cart page · cart drawer |
| S-23 | Checkout — Payment | `/{locale}/checkout/payment` | success · loading · provider-down (one gateway hidden) · validation-error · redirecting | `PaymentProviderList` (only enabled providers) · `CmiButton` · `StripeForm` · `CodOption` · `StepNav` (2 of 3) · `OrderSummarySidebar` | Address step |
| S-24 | Checkout — Confirmation | `/{locale}/checkout/confirmation/{orderId}` | success · loading · not-found (unauthorized access to others' order) | `OrderConfirmationCard` · `OrderItemsList` · `NextStepsBlock` (email sent, what now) · `ContinueShoppingCTA` | After place-order succeeds; email link |

## 4. Account

| # | Screen | Route | States | Key Components | Linked From |
|---|---|---|---|---|---|
| S-30 | Account hub | `/{locale}/account` | logged-in success · logged-out (redirect to login) · loading | `AccountSidebar` · `WelcomeBlock` · `RecentOrdersPreview` · `QuickLinksGrid` | Header account icon |
| S-31 | Login | `/{locale}/account/login` | idle · submitting · invalid-credentials · rate-limited · network-error | `LoginForm` (client) · `MagicLinkOption` (optional) · `RegisterLink` · `PasswordResetLink` | Account-icon when signed out; redirect target |
| S-32 | Register | `/{locale}/account/register` | idle · submitting · validation-error · email-already-used · success-pending-verify | `RegisterForm` (client) · `LoginLink` · `LegalCheckbox` (privacy + terms) | Login screen |
| S-33 | Password reset request | `/{locale}/account/password-reset` | idle · submitting · email-sent · rate-limited | `ResetRequestForm` | Login screen |
| S-34 | Password reset confirm | `/{locale}/account/password-reset/{token}` | idle · submitting · invalid-token · expired-token · success | `ResetConfirmForm` | Email link |
| S-35 | Profile | `/{locale}/account/profile` | success · saving · saved · validation-error · network-error | `ProfileForm` · `ChangePasswordSection` · `LanguagePreferenceSelector` | Account hub |
| S-36 | Orders list | `/{locale}/account/orders` | success · empty (no orders yet) · loading · error | `OrderTable` · `Pagination` · `OrderRow` (status badge) | Account hub |
| S-37 | Order detail | `/{locale}/account/orders/{orderId}` | success · loading · not-found · unauthorized | `OrderHeader` (number, date, status) · `OrderItemsList` · `OrderTotalsBlock` · `ShippingAddressBlock` · `PaymentMethodBlock` · `ReorderCTA` | Orders list; email link |
| S-38 | Address book | `/{locale}/account/addresses` | success · empty · saving · saved · delete-confirm-modal | `AddressList` · `AddressCard` · `AddressForm` (client) · `DefaultBadge` | Account hub · checkout (add new address) |

## 5. Legal & Compliance

| # | Screen | Route | States | Key Components | Linked From |
|---|---|---|---|---|---|
| S-40 | Privacy policy | `/{locale}/legal/privacy` | success · 404 (not configured) | `StaticTemplate` · `RichTextBlock` · `LastUpdatedNote` | Footer · register checkbox · cookie banner |
| S-41 | Terms of service | `/{locale}/legal/terms` | success · 404 | `StaticTemplate` · `RichTextBlock` | Footer · register checkbox |
| S-42 | Cookies policy | `/{locale}/legal/cookies` | success · 404 | `StaticTemplate` · `RichTextBlock` | Cookie banner |
| S-43 | Returns policy | `/{locale}/legal/returns` | success · 404 | `StaticTemplate` · `RichTextBlock` | PDP shipping/returns tab · footer |
| S-44 | Cookie consent banner (overlay, not a route) | — | first-visit · dismissed · settings-open | `CookieBanner` (client) · `CookieSettingsModal` · `CategoryToggles` | Auto-shows on first visit until consent recorded |

## 6. System pages

| # | Screen | Route | States | Key Components | Linked From |
|---|---|---|---|---|---|
| S-50 | 404 Not found | `/404` (catch-all) | rendered for any unmatched route | `NotFoundBlock` · `SuggestedCategoriesRail` · `BackToHomeCTA` | Any broken link |
| S-51 | 500 Error | `/500` (boundary) | rendered when an RSC throws | `ErrorBlock` · `RetryButton` · `ContactSupportLink` | Caught by Next.js error boundary |
| S-52 | Maintenance / offline | served by edge or proxy | shown when storefront is intentionally down | `MaintenanceBlock` (static HTML) | Only when explicitly enabled via env flag |

---

## State coverage checklist

For every interactive screen above (S-12, S-13, S-20, S-22, S-23, S-31, S-32, S-35, S-36, S-38), the implementation MUST ship:

- [ ] **Empty state** — no data, helpful next action (not just "no items")
- [ ] **Loading state** — skeleton or spinner; visible within 100ms
- [ ] **Error state** — distinct copy per error class; "retry" CTA where applicable
- [ ] **Success state** — the happy path
- [ ] **Edge cases listed in the table** — out-of-stock, expired token, unauthorized, rate-limited, etc.

Static pages (S-02, S-40 to S-43) only need success + 404.

---

## Component dependency summary

Cross-cut components used by ≥ 3 screens — build these first:

- `BreadcrumbBar` · `StepNav` · `LineItemList` · `OrderItemsList` · `AccountSidebar` · `OrderSummarySidebar` · `ProductGrid` · `BrandFooter` · `LocaleSwitcher` · `Pagination` · `RichTextBlock` · `StaticTemplate`

Screen-specific components are listed inline. None should be built before its primary screen has a real use for it.

---

## Total

**52 numbered screens** (S-01..S-52), grouped into 6 logical sections, all governed by **6 shared page templates** (per `04-information-architecture.md` §5). Each persona's journey from `04-user-journey-maps.md` is fully covered by screens above.
