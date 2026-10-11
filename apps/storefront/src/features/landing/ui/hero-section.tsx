import Image from "next/image";
import Link from "next/link";
import { HeroClient } from "./hero-client";

interface HeroSectionProps {
  data: {
    title: string;
    description: string;
    image: { src: string; alt: string };
    categories: Array<{ id: string; label: string; href: string }>;
    cta: { label: string; href: string };
  };
}

export function HeroSection({ data: hero }: HeroSectionProps) {
  return (
    <section className="relative flex justify-center items-center min-h-[780px] xl:h-screen pt-20 overflow-hidden bg-background">
      {/* Background Image Overlay */}
      <div className="absolute inset-0 z-[2] bg-black/20 pointer-events-none" />
      
      {/* Background Image Absolute */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <Image
          src={hero.image.src}
          alt={hero.image.alt}
          fill
          priority
          sizes="100vw"
          className="hero-bg-image object-cover"
        />
      </div>

      <HeroClient>
        {/* Base Container */}
        <div className="w-full max-w-[940px] xl:max-w-[1200px] mx-auto px-5 lg:px-10 flex flex-col items-center relative z-[3] h-full justify-center">
          
          {/* Hero Center Content */}
          <div className="w-full flex flex-col-reverse md:flex-row justify-center md:justify-between items-center md:items-center gap-14 md:gap-20 lg:gap-32 relative">
            
            {/* Hero Left Block */}
            <div className="mt-5 w-full md:w-[190px] flex justify-center md:justify-start shrink-0">
              <div className="flex flex-col gap-4 md:gap-5 w-full">
                {hero.categories.map((category) => (
                  <div key={category.id} className="w-full">
                    <Link
                      href={category.href}
                      className="hero-category-link group flex justify-center md:justify-between items-center w-full min-h-[44px] py-2 text-[10px] md:text-[11px] uppercase font-medium tracking-[0.25em] font-body text-white transition-all duration-300 md:opacity-70 hover:opacity-100 md:hover:pl-2"
                    >
                      <span>{category.label}</span>
                      
                      {/* Clip mobile hidden */}
                      <div className="hidden md:block relative overflow-hidden w-[15px] h-[15px]">
                        <div className="flex items-center justify-center w-full h-full transition-transform duration-300 group-hover:-translate-y-full">
                          <Image src="/assets/beano/aHR0cHM6_6973e7102ccfa0826cb1870d_Frame (1).svg" alt="Arrow" width={15} height={15} className="object-cover" />
                        </div>
                        <div className="absolute bottom-[-100%] flex items-center justify-center w-full h-full transition-transform duration-300 group-hover:-translate-y-full">
                          <Image src="/assets/beano/aHR0cHM6_6973e7102ccfa0826cb1870d_Frame (1).svg" alt="Arrow" width={15} height={15} className="object-cover" />
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Right Block */}
            <div className="w-full max-w-[400px] md:max-w-[460px] lg:max-w-[720px] mx-auto md:mx-0 shrink">
              <div className="flex flex-col items-center md:items-start gap-8 lg:gap-10">
                
                {/* Hero Text Content */}
                <div className="flex flex-col justify-start items-center md:items-start text-center md:text-left w-full gap-5">
                  <h1 className="hero-reveal-text font-heading text-white text-[42px] leading-[1.1] md:text-[56px] lg:text-[84px] lg:leading-[0.95] font-light mt-5 mb-0 tracking-tight">
                    {hero.title}
                  </h1>
                  {/* MERGE-NOTE: rgba(255,255,255,0.9) — intentional, text over dark hero image, no token for partial-opacity white */}
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)' }} className="hero-reveal-text font-body text-sm md:text-[15px] font-light tracking-wide max-w-[400px] lg:max-w-[455px] mb-0 leading-relaxed">
                    {hero.description}
                  </p>
                </div>
                
                {/* Button Blur Holder */}
                <div className="hero-reveal-text">
                  <Link
                    href={hero.cta.href}
                    className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-[32px] py-[18px] text-[10px] md:text-[11px] font-medium uppercase tracking-[0.25em] font-body text-white transition-all duration-300 hover:bg-white/15 hover:border-white/40 shadow-sm"
                  >
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="relative overflow-hidden flex flex-col justify-center items-center h-[14px]">
                        <div className="transition-transform duration-300 group-hover:-translate-y-full leading-none">
                          {hero.cta.label}
                        </div>
                        <div className="absolute top-full transition-transform duration-300 group-hover:-translate-y-full leading-none">
                          {hero.cta.label}
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-[18px] h-[18px]">
                        <Image src="/assets/beano/aHR0cHM6_6972701304b731bfa1f61b71_Frame.svg" alt="Icon basket" width={18} height={18} />
                      </div>
                    </div>
                  </Link>
                </div>

              </div>
            </div>

          </div>
        </div>
      </HeroClient>
    </section>
  );
}
