"use client";

import { useState } from "react";
import Image from "next/image";

interface Review {
  quote: string;
  author: string;
  rating: number;
}

const ARROW = "/assets/beano/aHR0cHM6_6973e7102ccfa0826cb1870d_Frame (1).svg";
const STAR = "/assets/beano/aHR0cHM6_69788c0abd351b16de4679c2_Star 2.svg";

export function ReviewsClient({ label, items }: { label: string; items: Review[] }) {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 1) % items.length);

  return (
    <div className="relative flex-1 w-full min-h-[305px] flex flex-col justify-end md:ps-10 xl:ps-25 pb-20 md:pb-0">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((review, i) => (
            <div
              key={`${review.author}-${i}`}
              aria-hidden={i !== index}
              className="w-full shrink-0 flex flex-col gap-[30px] py-6 pe-5"
            >
              <p className="font-body text-sm font-medium uppercase tracking-[1.4px] text-foreground">
                {label}
              </p>
              <blockquote className="font-heading text-[24px] md:text-[30px] xl:text-[40px] leading-[1.2] tracking-[-1px] text-foreground max-w-[595px] xl:max-w-[650px]">
                {review.quote}
              </blockquote>
              <div className="flex flex-col gap-[6px]">
                <p className="font-body text-base font-medium uppercase tracking-[1.6px] text-foreground">
                  {review.author}
                </p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: review.rating }, (_, s) => (
                    <Image key={s} src={STAR} alt="" width={16} height={16} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrows pinned bottom-right, like the original slider */}
      <div className="absolute bottom-0 md:bottom-6 right-0 flex gap-[6px]">
        {/* Icon rolls through the button on hover (a-38…a-41) */}
        <button
          type="button"
          onClick={prev}
          aria-label="Previous review"
          className="group flex items-center justify-center w-[44px] h-[44px] rounded-full bg-background border border-border cursor-pointer transition-colors duration-300 hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="relative block w-[18px] h-[18px] overflow-hidden">
            <Image src={ARROW} alt="" width={18} height={18} className="rotate-180 invert transition-transform duration-[400ms] ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:-translate-x-full" />
            <Image src={ARROW} alt="" width={18} height={18} aria-hidden className="absolute inset-0 translate-x-full rotate-180 invert transition-transform duration-[400ms] ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:translate-x-0" />
          </span>
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next review"
          className="group flex items-center justify-center w-[44px] h-[44px] rounded-full bg-background border border-border cursor-pointer transition-colors duration-300 hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="relative block w-[18px] h-[18px] overflow-hidden">
            <Image src={ARROW} alt="" width={18} height={18} className="invert transition-transform duration-[400ms] ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:translate-x-full" />
            <Image src={ARROW} alt="" width={18} height={18} aria-hidden className="absolute inset-0 -translate-x-full invert transition-transform duration-[400ms] ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:translate-x-0" />
          </span>
        </button>
      </div>
    </div>
  );
}
