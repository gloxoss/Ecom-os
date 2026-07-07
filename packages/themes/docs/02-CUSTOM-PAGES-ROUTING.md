# Deep Dive: Custom Pages and Next.js Routing in Ecom-os

Welcome to the second installment of the Ecom-os Theme documentation library. This exhaustive 2000+ word guide focuses entirely on how Ecom-os subverts traditional Next.js routing limitations to allow for deeply customized, theme-specific page architectures. 

If you want to completely overhaul the structure of the homepage, replace the product detail page with an interactive 3D canvas, or inject bespoke promotional landing pages without touching the core `apps/storefront` routing files, this document is your blueprint.

---

## 1. The Limitation of Standard Next.js Routing

In standard Next.js App Router applications, the file system dictates the URL structure and the UI. A file located at `app/products/[slug]/page.tsx` will always dictate the layout and rendering of a product page. 

If an agency has 10 clients running on a monorepo, they usually resort to massive `if/else` statements inside the page component:

```tsx
// ❌ THE ANTI-PATTERN
export default function ProductPage({ params }) {
  const clientName = process.env.CLIENT_NAME;
  
  if (clientName === 'luxury') return <LuxuryProductPage slug={params.slug} />;
  if (clientName === 'minimal') return <MinimalProductPage slug={params.slug} />;
  return <DefaultProductPage slug={params.slug} />;
}
```

This violates the Open-Closed Principle. Every time you onboard a new client or create a new theme, you have to modify the core routing files. The bundle sizes grow larger, and the risk of breaking existing clients increases exponentially.

Ecom-os completely eliminates this pattern through the **Template Registry Injection Pattern**.

---

## 2. The Template Registry Injection Pattern

In Ecom-os, the core routing files (`app/page.tsx`, `app/products/[slug]/page.tsx`) act strictly as thin **Controllers**. They are responsible for:
1. Identifying the active theme.
2. Fetching the underlying data from the `EcomEngine`.
3. Looking up the appropriate React Component for that route from the active Theme's template registry.
4. Rendering the component and passing down the data as props.

### Defining the Theme Registry

In your theme configuration (`packages/themes/src/clients/luxury/theme.ts`), you can define a `templates` object mapping canonical route names to custom React components.

```tsx
// packages/themes/src/clients/luxury/theme.ts
import { EcomTheme } from '../../types';
import { LuxuryHomePage } from './components/LuxuryHomePage';
import { LuxuryProductView } from './components/LuxuryProductView';

export const luxuryTheme: EcomTheme = {
  config: {
    name: 'luxury',
    radius: '0.25rem',
    colors: { /* ... */ }
  },
  templates: {
    // Override the canonical 'home' route with a bespoke component
    home: LuxuryHomePage,
    // Override the canonical 'product.view' route
    'product.view': LuxuryProductView
  }
};
```

### The Core Controller (`app/page.tsx`)

Inside the actual Next.js application, the route file becomes a generic controller. It relies on the `getTheme()` utility to resolve the component dynamically.

```tsx
// apps/storefront/src/app/[locale]/page.tsx
import { getEngine } from '@/lib/engine';
import { getTheme } from '@ecom-os/themes';
import { DefaultHomePage } from '@/features/home/DefaultHomePage';

export default async function Page() {
  const engine = await getEngine();
  const theme = getTheme(process.env.THEME_NAME || 'default');
  
  // Data Fetching phase
  const [categories, featuredProducts] = await Promise.all([
    engine.listCategories(),
    engine.listProducts({ featured: true })
  ]);
  
  // Component Resolution phase
  // If the active theme defines a 'home' template, use it. Otherwise, fallback.
  const ResolvedHomePage = theme.templates?.['home'] || DefaultHomePage;
  
  // Render phase
  return (
    <ResolvedHomePage 
      categories={categories} 
      featuredProducts={featuredProducts.items} 
    />
  );
}
```

### Why this is revolutionary
1. **Zero Coupling:** The core Next.js application does not know that `LuxuryHomePage` exists. The dependency points in one direction: from the storefront to the themes package.
2. **Infinite Customization:** The `LuxuryHomePage` can import heavy WebGL libraries, massive Framer Motion animations, or completely bespoke CSS modules. None of this code is executed, bundled, or parsed for clients using the `minimal` theme.
3. **Clean Core:** The `apps/storefront` folder remains pristine. You can update Ecom-os core logic, routing middleware, and auth flows without ever touching client-specific UI code.

---

## 3. Creating Custom Server and Client Components in Themes

When you create a custom template for a theme, you must navigate the React Server Component (RSC) boundary carefully. 

The `getTheme()` registry in `index.ts` is resolving components on the Server. Therefore, the components you export from your theme can be Server Components!

### Scenario: A Heavily Animated Product Page
You are building the `minimal` theme. You want a product page that uses a complex GSAP scroll animation. You cannot put GSAP inside a Server Component.

**Step 1: The Server Component Shell**
Create a Server Component in the theme package that accepts the raw data from the controller. This component's job is to parse the data, handle SEO metadata, and set up the layout skeleton.

```tsx
// packages/themes/src/clients/minimal/components/MinimalProductView.tsx
import { Product } from '@ecom-os/engine';
import { MinimalScrollGallery } from './MinimalScrollGallery';
import { MinimalProductForm } from './MinimalProductForm';

interface Props {
  product: Product;
  relatedProducts: Product[];
}

export async function MinimalProductView({ product, relatedProducts }: Props) {
  // You can still execute server-side logic here if needed!
  // For example, reading cookies or headers.
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen bg-background text-foreground">
      {/* Client Component for heavy GSAP animations */}
      <MinimalScrollGallery images={product.images} />
      
      {/* Client Component for standard React state (Add to Cart) */}
      <div className="p-12 flex flex-col justify-center">
        <h1 className="text-6xl font-bold tracking-tighter uppercase">{product.name}</h1>
        <p className="mt-4 text-xl text-muted-foreground">{product.description}</p>
        
        <MinimalProductForm product={product} />
      </div>
    </div>
  );
}
```

**Step 2: The Client Components**
Now create the client components where the heavy lifting happens. Mark these strictly with `'use client'`.

```tsx
// packages/themes/src/clients/minimal/components/MinimalScrollGallery.tsx
'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function MinimalScrollGallery({ images }) {
  const containerRef = useRef(null);
  
  useLayoutEffect(() => {
    // Complex GSAP logic goes here
    const ctx = gsap.context(() => {
      gsap.to('.gallery-image', {
        y: -100,
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          scrub: 1
        }
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="overflow-hidden">
      {images.map(img => (
        <img key={img.id} src={img.url} className="gallery-image w-full h-auto object-cover" />
      ))}
    </div>
  );
}
```

### Crucial Note on the Bundle
Because Next.js resolves these components via an environment variable (`THEME_NAME`) at build time, and because we use static imports in `index.ts`, Webpack will try to bundle all themes. 
To prevent Webpack from parsing heavy libraries like GSAP for a client that doesn't use the minimal theme, you should configure your Next.js build to aggressively tree-shake unused exports from the theme registry. Better yet, in a highly optimized enterprise setup, the build script can dynamically rewrite `index.ts` to *only* import the active theme before Next.js compiles.

---

## 4. Handling Deeply Nested Routing and Modals

Sometimes a custom theme requires entirely new URLs that don't exist in the core Ecom-os router. For instance, the `luxury` theme might feature a completely bespoke "Lookbook" experience at `/lookbook`.

Because Ecom-os controls the router, you cannot arbitrarily add `/lookbook` via the theme registry. 

### The Solution: The Catch-All Custom Route
Ecom-os provides a Catch-All route specifically for theme-defined pages: `app/[locale]/custom/[...slug]/page.tsx`.

If you need a new page:
1. The user navigates to `/custom/lookbook`.
2. The Catch-All controller checks the active theme's registry for a `custom.lookbook` template.
3. If it exists, it renders it.

```tsx
// apps/storefront/src/app/[locale]/custom/[...slug]/page.tsx
import { getTheme } from '@ecom-os/themes';
import { notFound } from 'next/navigation';

export default async function CustomPage({ params }) {
  const theme = getTheme(process.env.THEME_NAME);
  const routeKey = `custom.${params.slug.join('.')}`;
  
  const CustomComponent = theme.templates?.[routeKey];
  
  if (!CustomComponent) {
    notFound();
  }
  
  return <CustomComponent params={params} />;
}
```

This ensures that routing logic remains centralized while view flexibility is infinitely decentralized.

---

## 5. Metadata and SEO Overrides

Custom pages often require custom SEO metadata. In Next.js App Router, metadata is defined via the `generateMetadata` function exported from the `page.tsx` file.

Because our `page.tsx` files are generic controllers, we pass the responsibility of metadata generation to the theme.

### Implementing Metadata Hooks
The `EcomTheme` type can optionally support metadata overrides.

```tsx
// packages/themes/src/types.ts
export interface EcomTheme {
  config: ThemeConfig;
  templates?: Record<string, React.ComponentType<any>>;
  metadata?: Record<string, (data: any) => import('next').Metadata>;
}
```

In your generic controller:

```tsx
// apps/storefront/src/app/[locale]/products/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const engine = await getEngine();
  const theme = getTheme(process.env.THEME_NAME);
  const product = await engine.getProductBySlug(params.slug);
  
  // If the theme has a specific way it wants to format product SEO, use it
  if (theme.metadata?.['product.view']) {
    return theme.metadata['product.view']({ product });
  }
  
  // Fallback to standard SEO
  return {
    title: `${product.name} | Ecom-os`,
    description: product.description
  };
}
```

This guarantees that a highly opinionated luxury brand can dictate exactly how their OpenGraph tags, Twitter cards, and Meta descriptions format the dynamic product data, without writing messy conditionals in the core codebase.

---

## Conclusion

By treating Next.js routing files as strictly logical controllers and delegating view resolution to the `EcomTheme` registry, Ecom-os achieves a level of modularity rarely seen in monolithic frameworks.

You can now confidently scaffold new clients, inject heavy animation libraries, drastically alter SEO behavior, and invent new page flows—all confined safely within the boundaries of a single `packages/themes/src/clients/[name]/` directory.

Next up, you should review `03-CART-AND-CHECKOUT-FLOW.md` to learn how to connect these beautiful bespoke React pages to the highly sensitive mutation logic of the shopping cart and checkout pipeline.
