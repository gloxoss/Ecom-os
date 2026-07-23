'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function CatalogHeroClient({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const photo = containerRef.current?.querySelector('[data-hero-photo]');
        if (!photo) return;

        // Continuous parallax while the hero is in view (a-138): scale 1.08 -> 1.1, y -3% -> 5%.
        gsap.fromTo(
          photo,
          { scale: 1.08, yPercent: -3 },
          {
            scale: 1.1, yPercent: 5, ease: 'none',
            scrollTrigger: { trigger: containerRef.current, start: 'top top', end: 'bottom top', scrub: true },
          }
        );
      });
      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return <div ref={containerRef}>{children}</div>;
}
