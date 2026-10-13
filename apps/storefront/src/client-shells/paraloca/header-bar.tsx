'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCartStore } from '@/stores/cart-store';
import { SearchAutocomplete, defaultFetchSuggestions } from '@/components/search';

interface HeaderBarProps {
  brandName: string;
  showQuotes: boolean;
}

export function ParalocaHeaderBar({ brandName, showQuotes }: HeaderBarProps) {
  const [open, setOpen] = useState(false);
  const cartCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));

  const links = [
    { label: 'Accueil', href: '/' },
    { label: 'Catalogue', href: '/catalog' },
    { label: 'Contact', href: '/contact-us' },
    ...(showQuotes ? [{ label: 'Devis professionnels', href: '/devis' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur" data-testid="paraloca-header">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:rounded focus:bg-background focus:px-3 focus:py-2"
      >
        Passer au contenu principal
      </a>
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-semibold tracking-tight" aria-label={`${brandName}, accueil`}>
          {brandName}
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-6 text-sm md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-foreground/80 transition-colors hover:text-accent">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden w-64 lg:block">
            <SearchAutocomplete fetchSuggestions={defaultFetchSuggestions} placeholder="Rechercher un produit" />
          </div>
          <Link
            href="/cart"
            className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent"
            data-testid="paraloca-cart-link"
          >
            Panier ({cartCount})
          </Link>
          <button
            type="button"
            className="rounded-full border border-border px-3 py-2 text-sm md:hidden"
            aria-expanded={open}
            aria-controls="paraloca-mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            Menu
          </button>
        </div>
      </div>

      {open ? (
        <div id="paraloca-mobile-menu" className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="mb-4">
            <SearchAutocomplete fetchSuggestions={defaultFetchSuggestions} placeholder="Rechercher un produit" />
          </div>
          <nav aria-label="Navigation mobile" className="flex flex-col gap-3 text-base">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="py-1">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
