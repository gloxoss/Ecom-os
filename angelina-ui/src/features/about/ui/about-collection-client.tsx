'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface Tab {
  id: string;
  label: string;
  title: string;
  description: string;
  image: { url: string; alt: string };
}

export function AboutCollectionClient({ tabs }: { tabs: Tab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const panelRef = useRef<HTMLDivElement>(null);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  // Card content cross-fades on tab change (a-58 fade, reused for the swap).
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(panelRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'easeIn' });
      });
      return () => mm.revert();
    },
    { scope: panelRef, dependencies: [activeId] }
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
      {/* Vertical tab list */}
      <div data-reveal role="tablist" className="flex flex-col divide-y divide-border border-t border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeId}
            onClick={() => setActiveId(tab.id)}
            className={`group flex items-center justify-between py-4 text-left font-body text-sm font-medium uppercase tracking-[1.4px] transition-colors duration-300 cursor-pointer ${
              tab.id === activeId ? 'text-foreground' : 'text-foreground/50 hover:text-foreground'
            }`}
          >
            {tab.label}
            <ArrowRight
              size={16}
              strokeWidth={1.75}
              className={`transition-transform duration-300 ${tab.id === activeId ? '-rotate-45' : 'group-hover:-rotate-45'}`}
            />
          </button>
        ))}
      </div>

      {/* Swapping image + info card */}
      <div ref={panelRef} className="relative overflow-hidden rounded-2xl aspect-4/3">
        <Image src={active.image.url} alt={active.image.alt} fill sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" />
        <div className="absolute inset-0 bg-foreground/20" />
        <div className="absolute left-5 bottom-5 right-5 md:right-auto md:w-[260px] rounded-2xl bg-background/90 backdrop-blur-sm p-6 flex flex-col gap-2">
          <p className="font-body text-xs font-medium uppercase tracking-[1.4px] text-foreground">
            {active.title}
          </p>
          <p className="font-body text-xs leading-[1.4] text-foreground/70">{active.description}</p>
        </div>
      </div>
    </div>
  );
}
