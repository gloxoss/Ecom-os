# ECO-803 User Journey & Navigation Continuity Evidence

- **Task**: `ECO-803`
- **Subject**: ParaLoca Complete Storefront Navigation & Guest Buy Flow
- **Execution Date**: 2026-10-10

---

## 1. Journey Architecture

```
[Accueil / Home] 
       │
       ├──► [Catégories / Categories (/catalog/[categorySlug])]
       │          │
       │          └──► [Filtres / Facets (Marque, Disponibilité)]
       │
       ├──► [Marques / Brands Directory (/brands/[slug])]
       │          │
       │          └──► [Owned vs Partner Brand Showcases]
       │
       ├──► [Guides Médicaux / Guides (/guides/[slug])]
       │          │
       │          └──► [Factual buying advice + link to catalog]
       │
       └──► [Fiche Produit / PDP (/product/[slug])]
                  │
                  ├──► [Ajout aux favoris / Wishlist (Client Local)]
                  │
                  └──► [Ajout au panier / Authoritative Cart]
                             │
                             └──► [Validation Panier / Cart (/cart)]
                                        │
                                        └──► [Commande Invité / Guest Checkout (/checkout)]
                                                   │
                                                   └──► [Confirmation Commande Woo HPOS]
```

---

## 2. Invariants & Proof Points

1. **Zero Forced Account Creation**:
   - Guests browse, save favorites, select variations, add to cart, and checkout with zero mandatory registration.
   - Favorites persist strictly in browser `localStorage` under `ecom_wishlist` without server user entity creation.
2. **Moroccan Market Context**:
   - Address form pre-fills and validates Moroccan cities (Casablanca, Rabat, Marrakech, etc.) with postal codes.
   - Currency display strictly in `MAD`.
3. **Certified Payment Gateways**:
   - Cash on Delivery (`cod`) is active and certified.
   - Idempotent order creation prevents double-submission on repeat click.
4. **Brand Diversity**:
   - Both owned-brand items (ParaLoca equipment) and partner items (Rossmax, Omron, Invacare) share the identical shopping cart, checkout, and search index.
