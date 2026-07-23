'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export function MenuHeroClient({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1.2 } });
      
      // Animate split text letters
      tl.to('.gsap_split_letter', {
        y: '0%',
        stagger: 0.04,
      });

      // Animate description
      tl.to(
        '[data-animate="hero-desc"]',
        { 
          y: 0, 
          opacity: 1, 
          filter: 'blur(0px)', 
          duration: 1, 
          ease: 'power3.out' 
        },
        '-=0.8' // Start slightly before the title finishes
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      {children}
    </div>
  );
}
