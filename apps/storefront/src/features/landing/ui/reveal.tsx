"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Scroll-entrance island implementing the Webflow-derived motion recipes
 * (docs/animations/home-animations.md). Mark descendants with:
 *   data-reveal           rise-blur-fade (signature move, staggered)
 *   data-reveal-fade      plain fade (a-34 / a-46)
 *   data-reveal-zoom      image zoom-settle 1.3 -> 1 (a-31)
 *   data-reveal-curtain   overlay collapses height 100% -> 0 (a-32); markup starts h-0
 *   data-reveal-right     slide in from the right (slideInRight)
 *   data-reveal-left      slide in from the left (slideInLeft)
 *   data-reveal-line      divider draws scaleX 0 -> 1 (a-35)
 *   data-reveal-draw      SVG circle stroke draw, pathLength=1 (a-37)
 *   data-reveal-kenburns  bg drift: scale 1.2 fixed, y -5% -> 5% over 10s (a-51)
 *   data-reveal-slide-list / data-reveal-slide-item
 *                         desktop slot slide / mobile item stagger (a-36/a-48)
 *   data-reveal-bottom    slide up from below + fade (slideInBottom, e.g. FAQ accordion rows)
 *   data-reveal-parallax-zoom
 *                         continuous scroll-scrubbed zoom, scale 1 -> 1.2 across the whole
 *                         time the element is in view (a-56) — distinct from data-reveal-zoom,
 *                         which settles once and stops.
 */
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          reduceMotion: "(prefers-reduced-motion: reduce)",
          isDesktop: "(min-width: 768px)",
        },
        (context) => {
          const { reduceMotion, isDesktop } = context.conditions ?? {};
          if (reduceMotion) return;

          const root = ref.current;
          if (!root) return;
          const q = (sel: string) => gsap.utils.toArray<HTMLElement>(sel, root);
          const once = (trigger: Element | null, start = "top 80%") => ({
            trigger: trigger ?? root,
            start,
            once: true,
          });

          const rise = q("[data-reveal]");
          if (rise.length) {
            gsap.set(rise, { y: 20, opacity: 0, filter: "blur(3px)" });
            gsap.to(rise, {
              y: 0, opacity: 1, filter: "blur(0px)",
              duration: 0.8, stagger: 0.12, ease: "power3.out",
              scrollTrigger: once(root),
            });
          }

          const fade = q("[data-reveal-fade]");
          if (fade.length) {
            gsap.fromTo(fade, { opacity: 0 }, {
              opacity: 1, duration: 1.2, ease: "power1.inOut", scrollTrigger: once(root),
            });
          }

          q("[data-reveal-zoom]").forEach((el) => {
            gsap.fromTo(el, { scale: 1.3 }, {
              scale: 1, duration: 1.5, ease: "power1.out", scrollTrigger: once(el, "top bottom"),
            });
          });

          q("[data-reveal-curtain]").forEach((el) => {
            gsap.fromTo(el, { height: "100%" }, {
              height: "0%", duration: 1.2, ease: "power1.inOut",
              scrollTrigger: once(el.parentElement),
            });
          });

          const right = q("[data-reveal-right]");
          if (right.length) {
            gsap.fromTo(right, { x: 100, opacity: 0 }, {
              x: 0, opacity: 1, duration: 1, stagger: 0.12, ease: "power3.out",
              scrollTrigger: once(root, "top 85%"),
            });
          }

          const left = q("[data-reveal-left]");
          if (left.length) {
            gsap.fromTo(left, { x: -100, opacity: 0 }, {
              x: 0, opacity: 1, duration: 1, stagger: 0.12, ease: "power3.out",
              scrollTrigger: once(root, "top 85%"),
            });
          }

          q("[data-reveal-line]").forEach((el) => {
            gsap.fromTo(el, { scaleX: 0, transformOrigin: "left center" }, {
              scaleX: 1, duration: 1.3, ease: "power1.out", scrollTrigger: once(el),
            });
          });

          q("circle[data-reveal-draw]").forEach((el) => {
            gsap.fromTo(el, { strokeDashoffset: 1 }, {
              strokeDashoffset: 0, duration: 1.2, delay: 0.4, ease: "power1.inOut",
              scrollTrigger: once(el, "top 90%"),
            });
          });

          q("[data-reveal-kenburns]").forEach((el) => {
            gsap.fromTo(el, { scale: 1.2, yPercent: -5 }, {
              scale: 1.2, yPercent: 5, duration: 10, ease: "power1.inOut",
              scrollTrigger: once(el, "top bottom"),
            });
          });

          const bottom = q("[data-reveal-bottom]");
          if (bottom.length) {
            gsap.fromTo(bottom, { y: 100, opacity: 0 }, {
              y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out",
              scrollTrigger: once(root, "top 85%"),
            });
          }

          q("[data-reveal-parallax-zoom]").forEach((el) => {
            gsap.fromTo(el, { scale: 1 }, {
              scale: 1.2, ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            });
          });

          const slideLists = q("[data-reveal-slide-list]");
          if (slideLists.length) {
            if (isDesktop) {
              gsap.fromTo(slideLists, { yPercent: 100 }, {
                yPercent: 0, duration: 0.8, ease: "power4.inOut",
                scrollTrigger: once(slideLists[0], "top 85%"),
              });
            } else {
              const slideItems = q("[data-reveal-slide-item]");
              gsap.fromTo(slideItems, { y: 20, opacity: 0, filter: "blur(3px)" }, {
                y: 0, opacity: 1, filter: "blur(0px)",
                duration: 1, stagger: 0.1, ease: "power3.inOut",
                scrollTrigger: once(slideLists[0], "top 85%"),
              });
            }
          }
        }
      );

      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
