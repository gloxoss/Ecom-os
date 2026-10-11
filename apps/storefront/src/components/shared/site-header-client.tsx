'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_LINKS } from './data/header-content';
import { useCartStore } from '@/stores/cart-store';
import { AnimatedNavLink } from './animated-nav-link';

// Routes whose hero sits on a dark image/overlay — everything else has a plain
// light background, so the header needs dark text from the very first frame
// instead of the white-until-scroll treatment those dark heroes need.
const DARK_HERO_ROUTES = ['/', '/about-us', '/catalog'];

export function SiteHeaderClient() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Zustand store for cart items count
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const hasDarkHero = DARK_HERO_ROUTES.includes(pathname);
  const showLightText = hasDarkHero && !isScrolled;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-[1000]">

      {/* Frosted glass bg — fades in on scroll */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: isScrolled ? 1 : 0,
          // Intentional raw rgba() for frosted glass header bg per THEME-NOTES.md
          backgroundColor: 'rgba(244,243,240,0.85)',
          backdropFilter: 'blur(9px)',
          WebkitBackdropFilter: 'blur(9px)',
        }}
      />

      {/* Divider line at bottom */}
      <div
        className={`absolute bottom-0 left-0 w-full h-px pointer-events-none transition-colors duration-500 ${
          showLightText ? 'bg-white/30' : 'bg-foreground/15'
        }`}
      />

      {/* Main nav bar — 80px tall. White only over a dark hero and only until scrolled past it. */}
      <div
        className={`relative z-10 w-full px-6 lg:px-10 h-20 flex items-center justify-between transition-colors duration-500 ${
          showLightText ? 'text-white' : 'text-foreground'
        }`}
      >

        {/* Logo */}
        <Link href="/" className="flex-none flex items-center min-h-[44px] hover:opacity-80 transition-opacity duration-300">
          {/* Using plain <img> for SVG to avoid next/image domain restrictions and intrinsic-size inflation */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/beano/aHR0cHM6_6973218a40348d7dc76feb49_Beano Logo.svg"
            alt="Beano Coffee logo"
            className="transition-[filter] duration-500"
            style={{
              height: '42px',
              width: 'auto',
              // The logo SVG is white — darken it whenever the nav text is dark too
              filter: showLightText ? 'none' : 'brightness(0) saturate(100%)',
            }}
          />
        </Link>

        {/* Desktop nav — centered. Using div NOT nav to avoid webflow-styles.css `nav{display:block}` overriding Tailwind flex */}
        <div role="navigation" className="hidden lg:flex items-center gap-0 flex-1 justify-center">
          {NAV_LINKS.map((link) => (
            <AnimatedNavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </div>

        {/* Desktop right actions */}
        <div className="hidden lg:flex items-center gap-0">
          <AnimatedNavLink href="/search" label="Search" />
          <AnimatedNavLink href="/cart" label={`Cart (${cartCount})`} />
        </div>

        {/* Hamburger — mobile only */}
        <button
          className="lg:hidden flex flex-col items-center justify-center gap-[5px] w-10 h-10 border border-current/50 rounded-full transition-colors duration-500"
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-px bg-current transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
          <span className={`block w-5 h-px bg-current transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-px bg-current transition-transform duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
        </button>

      </div>

      {/* Mobile dropdown */}
      <div
        className={`lg:hidden absolute top-full left-0 w-full bg-white border-t border-black/10 overflow-hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'max-h-[600px]' : 'max-h-0'
        }`}
      >
        <nav className="flex flex-col py-4 px-6">
          {[
            ...NAV_LINKS,
            { label: 'Search', href: '/search' },
            { label: `Cart (${cartCount})`, href: '/cart' }
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`py-3 text-sm uppercase tracking-widest font-medium font-body border-b border-black/5 last:border-0 ${
                pathname === link.href ? 'text-[var(--color-cafe)]' : 'text-black'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

    </header>
  );
}
