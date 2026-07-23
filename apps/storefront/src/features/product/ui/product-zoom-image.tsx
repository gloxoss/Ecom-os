'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface ProductZoomImageProps {
  image: { url: string; altText: string };
  badgeImage?: { url: string; altText: string };
}

/**
 * Magnify-on-hover product photo (a-122/a-123/a-124 in docs/animations): a
 * 3x-scaled copy of the image sits behind a clipped viewport and follows the
 * cursor. gsap.quickTo is the idiomatic pattern for repeated mousemove tweens
 * — it reuses one tween instead of creating a new one per event.
 */
export function ProductZoomImage({ image, badgeImage }: ProductZoomImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const zoomedImgRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(hover: hover) and (prefers-reduced-motion: no-preference)', () => {
        const container = containerRef.current;
        const lens = lensRef.current;
        const zoomedImg = zoomedImgRef.current;
        if (!container || !lens || !zoomedImg) return;

        const moveX = gsap.quickTo(zoomedImg, 'xPercent', { duration: 0.3, ease: 'power2.out' });
        const moveY = gsap.quickTo(zoomedImg, 'yPercent', { duration: 0.3, ease: 'power2.out' });

        const onMove = (e: MouseEvent) => {
          const rect = container.getBoundingClientRect();
          const fracX = gsap.utils.clamp(0, 1, (e.clientX - rect.left) / rect.width);
          const fracY = gsap.utils.clamp(0, 1, (e.clientY - rect.top) / rect.height);
          // Scaled image is 3x its container — offset by -0% to -66.7% covers its full pannable range.
          moveX(fracX * -66.7);
          moveY(fracY * -66.7);
        };

        const onEnter = () => gsap.to(lens, { opacity: 1, duration: 0.2 });
        const onLeave = () => gsap.to(lens, { opacity: 0, duration: 0.2 });

        container.addEventListener('mousemove', onMove);
        container.addEventListener('mouseenter', onEnter);
        container.addEventListener('mouseleave', onLeave);
        return () => {
          container.removeEventListener('mousemove', onMove);
          container.removeEventListener('mouseenter', onEnter);
          container.removeEventListener('mouseleave', onLeave);
        };
      });
      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-2xl bg-input aspect-square cursor-zoom-in">
      <Image src={image.url} alt={image.altText} fill sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" priority />

      {/* Magnify lens — hidden until hover, follows the cursor via quickTo above */}
      <div ref={lensRef} className="absolute inset-0 z-[2] overflow-hidden opacity-0 pointer-events-none">
        <div ref={zoomedImgRef} className="absolute inset-0 w-[300%] h-[300%]">
          <Image src={image.url} alt="" fill sizes="300vw" className="object-cover" />
        </div>
      </div>

      {badgeImage && (
        <div className="absolute bottom-5 right-5 z-[3] w-14 h-14 rounded-full overflow-hidden border border-border shadow-[0_2px_10px_0_rgba(0,0,0,0.11)]">
          <Image src={badgeImage.url} alt={badgeImage.altText} fill sizes="56px" className="object-cover" />
        </div>
      )}
    </div>
  );
}
