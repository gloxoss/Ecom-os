"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DEFAULT_CTA_CONFIG, resolveChoreography, type CtaChoreographyConfig } from "./cta-collage-config";
import { CtaCollageDebugPanel } from "./cta-collage-debug-panel";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface CtaCollageClientProps {
  children: React.ReactNode;
  /** Ambient 25s orbit loop (a-113) — only present on some pages in the original. */
  withOrbit?: boolean;
}

export function CtaCollageClient({ children, withOrbit = false }: CtaCollageClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<CtaChoreographyConfig>({ ...DEFAULT_CTA_CONFIG, withOrbit });

  // Rebuilds whenever `config` changes — useGSAP reverts the previous context
  // (killing old tweens/ScrollTriggers) before re-running, which is exactly
  // what live-editing from the debug panel needs.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { reduceMotion: "(prefers-reduced-motion: reduce)", isDesktop: "(min-width: 768px)" },
        (context) => {
          const { reduceMotion, isDesktop } = context.conditions ?? {};
          if (reduceMotion) return;

          const root = containerRef.current;
          if (!root) return;
          const wrapper = root.closest("[data-cta-wrapper]");
          const title = root.querySelector("[data-cta-content]");
          const imagesWrap = root.querySelector("[data-cta-images]");
          const images = gsap.utils.toArray<HTMLElement>("[data-cta-image]", root);
          if (!wrapper || !title || !imagesWrap || !images.length) return;

          const choreography = resolveChoreography(config);

          if (isDesktop) {
            // Explosion -> settle -> exit, scrubbed across the pinned section's scroll range (a-112).
            gsap.set(title, { scale: config.titleScaleStart, transformOrigin: "center" });
            gsap.set(imagesWrap, { opacity: 0, yPercent: 0 });
            images.forEach((img, i) => gsap.set(img, choreography[i % choreography.length].burst));

            const tl = gsap.timeline({
              scrollTrigger: {
                id: "cta-explosion",
                trigger: wrapper,
                start: "top top",
                end: "bottom bottom",
                scrub: config.scrub,
              },
            });

            tl.to(title, { scale: 1, duration: 0.1, ease: "power1.inOut" }, config.titlePosition);
            tl.to(imagesWrap, { opacity: 1, duration: config.fadeInDuration, ease: "none" }, config.fadeInPosition);
            images.forEach((img, i) => {
              tl.to(img, { ...choreography[i % choreography.length].settled, duration: config.settleDuration, ease: "power1.inOut" }, config.settlePosition);
            });
            tl.to(imagesWrap, { yPercent: -100, duration: config.exitDuration, ease: "power1.in" }, config.exitPosition);

            // Ambient orbit (a-113): the collage slowly rotates while each image counter-rotates to stay upright.
            if (config.withOrbit) {
              gsap.to(imagesWrap, { rotation: 360, duration: config.orbitDuration, ease: "none", repeat: -1 });
              gsap.to(images, { rotation: -360, duration: config.orbitDuration, ease: "none", repeat: -1 });
            }
          } else {
            // Mobile: simplified discrete reveal — no scrub math on small viewports (matches original's a-48 fallback).
            gsap.set(images, { opacity: 0, y: 20, filter: "blur(3px)" });
            gsap.set(title, { opacity: 0, y: 20, filter: "blur(3px)" });
            gsap.to([title, ...images], {
              opacity: 1, y: 0, filter: "blur(0px)",
              duration: 0.8, stagger: 0.1, ease: "power3.out",
              scrollTrigger: { trigger: wrapper, start: "top 70%", once: true },
            });
          }
        }
      );

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [config] }
  );

  return (
    <div ref={containerRef} className="h-full w-full">
      {children}
      {process.env.NODE_ENV !== "production" && (
        <CtaCollageDebugPanel config={config} onChange={setConfig} />
      )}
    </div>
  );
}
