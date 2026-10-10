'use client';

import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Product } from '@ecom-os/engine';
import { ProductCard } from './product-card';
import { ProductCardSkeleton } from './product-card-skeleton';

gsap.registerPlugin(ScrollTrigger);

export interface ProductGridProps {
  products: Product[];
  emptyText?: string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

export function ProductGridAnimated({
  products,
  emptyText = 'Aucun produit trouvé.',
  isLoading = false,
  isError = false,
  errorMessage = 'Une erreur est survenue lors du chargement des produits.',
  onRetry,
}: ProductGridProps) {
  const container = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useGSAP(() => {
    if (!container.current || prefersReducedMotion) return;

    // Targets every card by the "product-card-item" class and staggers them in on scroll
    gsap.from(container.current.querySelectorAll('.product-card-item'), {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: container.current,
        start: 'top 85%',
        once: true,
      },
    });
  }, { scope: container, dependencies: [prefersReducedMotion, products] });

  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12"
        role="status"
        aria-busy="true"
        aria-label="Chargement des produits"
      >
        {Array.from({ length: 8 }).map((_, idx) => (
          <ProductCardSkeleton key={idx} />
        ))}
        <span className="sr-only">Chargement du catalogue de produits en cours...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto"
      >
        <p className="text-destructive font-semibold mb-2">{errorMessage}</p>
        <p className="text-muted-foreground text-sm mb-6">
          Veuillez vérifier votre connexion ou réessayer ultérieurement.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-[44px] px-6 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none transition motion-reduce:transition-none"
          >
            Réessayer
          </button>
        )}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center py-24 px-4 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-foreground font-medium text-lg mb-1">{emptyText}</p>
        <p className="text-muted-foreground text-sm max-w-sm">
          Essayez d'ajuster vos filtres de recherche ou consultez notre collection complète.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={container}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12"
      aria-label="Catalogue des produits"
    >
      {products.map((product) => (
        <div key={product.id} className="product-card-item motion-reduce:transform-none">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
