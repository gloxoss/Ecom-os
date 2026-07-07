'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Link from 'next/link';

gsap.registerPlugin(useGSAP);

export function HeroClient({ title, subtitle, ctaLabel, ctaHref }: { title: string; subtitle: string; ctaLabel: string; ctaHref: string }) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.hero-element', {
      y: 30,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out'
    });
  }, { scope: container });

  return (
    <div ref={container} className="relative w-full min-h-[70vh] flex flex-col items-center justify-center bg-background text-foreground text-center px-4">
      <h1 className="hero-element text-5xl md:text-7xl font-bold tracking-tight mb-6">
        {title}
      </h1>
      <p className="hero-element text-lg md:text-xl text-secondary mb-8 max-w-2xl">
        {subtitle}
      </p>
      <Link href={ctaHref} className="hero-element bg-primary text-white px-8 py-4 rounded-md font-medium hover:opacity-90 transition-opacity">
        {ctaLabel}
      </Link>
    </div>
  );
}
