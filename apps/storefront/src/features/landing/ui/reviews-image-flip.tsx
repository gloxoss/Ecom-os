"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

interface ReviewsImageFlipProps {
  image: {
    src: string;
    alt: string;
  };
}

export function ReviewsImageFlip({ image }: ReviewsImageFlipProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP(
    () => {
      gsap.set("[data-review-image]", {
        transformPerspective: 800,
        transformStyle: "preserve-3d",
      });
    },
    { scope: rootRef }
  );

  const handlePointerEnter = () => contextSafe(() => {
    const imageEl = rootRef.current?.querySelector("[data-review-image]");
    if (!imageEl) return;

    gsap.fromTo(
      imageEl,
      { rotationY: 0 },
      {
        rotationY: 180,
        duration: 0.5,
        ease: "power2.inOut",
        repeat: 1,
        yoyo: true,
        overwrite: true,
      }
    );
  })();

  return (
    <div
      ref={rootRef}
      onPointerEnter={handlePointerEnter}
      className="relative h-[300px] w-full shrink-0 overflow-hidden rounded-2xl md:h-[305px] md:w-[305px]"
    >
      <Image
        data-review-image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(max-width: 767px) 100vw, 305px"
        className="object-cover will-change-transform"
      />
    </div>
  );
}
