import Image from 'next/image';
import { MenuHeroClient } from './menu-hero-client';

interface MenuHeroProps {
  data: {
    title: string;
    description: string;
    backgroundImage: {
      url: string;
      alt: string;
    };
  };
}

function SplitText({ text }: { text: string }) {
  const words = text.split(' ');
  let letterCount = 1;

  return (
    <>
      {words.map((word, wordIndex) => (
        <div
          key={wordIndex}
          className={`gsap_split_word gsap_split_word${wordIndex + 1} mr-3 inline-block relative`}
          aria-hidden="true"
        >
          {word.split('').map((char) => {
            const currentLetterCount = letterCount++;
            return (
              <div
                key={currentLetterCount}
                className={`gsap_split_letter-mask gsap_split_letter${currentLetterCount}-mask relative inline-block overflow-hidden`}
              >
                <div
                  className={`gsap_split_letter gsap_split_letter${currentLetterCount} relative inline-block translate-y-full`}
                >
                  {char}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

export function MenuHero({ data }: MenuHeroProps) {
  return (
    <MenuHeroClient>
      <section className="relative flex min-h-[280px] w-full items-center justify-center bg-background pb-16 pt-[155px] md:pt-[175px] xl:min-h-[350px] 2xl:min-h-[400px]">
        {/* Background Image - Absolute positioned to the right */}
        <div className="absolute inset-0 z-0 ml-auto h-full w-full opacity-25 md:w-[100%] md:opacity-100 lg:w-[90%] 2xl:w-[65%]">
          <Image
            src={data.backgroundImage.url}
            alt={data.backgroundImage.alt}
            fill
            priority
            className="object-cover object-[100%_50%] lg:object-[0%_0%] xl:object-[0%_20%] 2xl:object-[0%_10%]"
            sizes="100vw"
          />
        </div>
        
        {/* Linear Overlay — MERGE-NOTE: rgba(255,255,255,…) intentional photo-to-bg fade, no token for partial-opacity white */}
        <div 
          className="absolute inset-0 z-[1]"
          /* Intentional raw rgba() for overlay gradient per THEME-NOTES.md */
          style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0) 53%, rgba(255, 255, 255, 0.3) 87%, var(--color-background) 100%, var(--color-background))' }}
        />


        {/* Content Holder */}
        <div className="relative z-[2] w-full">
          <div className="container mx-auto px-4 text-center md:px-8 lg:text-left">
            <div className="mx-auto flex max-w-[400px] flex-col gap-6 lg:mx-0 xl:max-w-[560px]">
              <h1
                aria-label={data.title}
                className="font-heading text-[38px] font-light leading-[44px] text-foreground tracking-widest"
              >
                <SplitText text={data.title} />
              </h1>
              <div className="banner-description">
                <p
                  data-animate="hero-desc"
                  className="font-body text-base font-light tracking-wide text-foreground/80 md:text-lg opacity-0"
                >
                  {data.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MenuHeroClient>
  );
}
