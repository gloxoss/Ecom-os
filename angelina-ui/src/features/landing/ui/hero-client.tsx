"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface HeroClientProps {
  children: React.ReactNode;
}

export function HeroClient({ children }: HeroClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Load timeline — categories 0.15s -> text 0.3s -> CTA (a-48/a-49/a-33)
        const tl = gsap.timeline();

        gsap.set(".hero-reveal-text", { opacity: 0, y: 20, filter: "blur(3px)" });
        gsap.set(".hero-category-link", { opacity: 0, x: -20, filter: "blur(3px)" });

        tl.to(".hero-category-link", {
          opacity: 1, x: 0, filter: "blur(0px)",
          duration: 0.7, stagger: 0.1, ease: "power1.inOut", delay: 0.15,
        });
        tl.to(".hero-reveal-text", {
          opacity: 1, y: 0, filter: "blur(0px)",
          duration: 1, stagger: 0.15, ease: "power3.inOut",
        }, 0.3);

        // Scroll-out scrub (a-50): hold to 50% of the hero's exit, then scale 1.1 / drift -5% by 90%
        const section = containerRef.current?.closest("section");
        const img = section?.querySelector(".hero-bg-image");
        if (section && img) {
          gsap.timeline({
            scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: 0.6 },
          })
            .to({}, { duration: 0.5 })
            .to(img, { scale: 1.1, yPercent: -5, ease: "none", duration: 0.4 })
            .to({}, { duration: 0.1 });
        }
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0 z-10">
      {children}
    </div>
  );
}
