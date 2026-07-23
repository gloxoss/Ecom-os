import Image from 'next/image';
import { RollLink } from '@/components/shared/roll-link';
import { CtaCollageClient } from './cta-collage-client';

export interface CtaCollageData {
  subtitle: string;
  title: string;
  button: { text: string; href: string };
  images: { url: string; alt: string }[];
}

interface CtaCollageProps {
  data: CtaCollageData;
  /** Ambient 25s orbit loop — present on some pages in the original (a-113), not others. */
  withOrbit?: boolean;
}

// Mirrors the original's tight, overlapping photo-pile placement — all 8 shots
// clustered inside a centered ~560px zone around the title, not spread across
// the viewport. Percentages are relative to that zone (see the wrapper below).
const IMAGE_LAYOUT = [
  'top-[0%] left-[6%] w-[34%] h-[38%]',
  'top-[2%] left-[38%] w-[30%] h-[34%] mt-2',
  'top-[0%] right-[2%] w-[34%] h-[42%]',
  'top-[36%] left-[0%] w-[32%] h-[36%]',
  'top-[38%] left-[32%] w-[28%] h-[32%]',
  'top-[32%] right-[4%] w-[36%] h-[42%]',
  'bottom-[0%] left-[10%] w-[32%] h-[34%]',
  'bottom-[2%] right-[8%] w-[34%] h-[36%]',
];

/**
 * Scroll-pinned image-collage CTA (a-112/a-113 in docs/animations) — shared by
 * every page that ends on this "explosion → settle → exit" closing invitation.
 */
export function CtaCollage({ data, withOrbit = false }: CtaCollageProps) {
  const { subtitle, title, button, images } = data;

  return (
    <section className="relative w-full bg-primary">
      {/* Tall wrapper gives the sticky inner section room to pin and run its scroll-scrubbed choreography. */}
      <div className="relative h-[200vh]" data-cta-wrapper>
        <CtaCollageClient withOrbit={withOrbit}>
          <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
            <div className="relative z-20 mx-auto max-w-4xl px-4 text-center" data-cta-content>
              <p className="mb-8 font-body text-sm font-medium uppercase tracking-[1.4px] text-primary-foreground/80">
                {subtitle}
              </p>
              <h2 className="mb-12 font-heading text-4xl leading-tight text-primary-foreground md:text-5xl lg:text-7xl">
                {title}
              </h2>
              <RollLink href={button.href} label={button.text} variant="glass" />
            </div>

            <div className="pointer-events-none absolute inset-0 z-10" data-cta-images>
              {/* Centered cluster zone — images below are positioned as percentages of this box. */}
              <div className="absolute left-1/2 top-1/2 w-[42vw] max-w-[620px] h-[60vh] max-h-[620px] -translate-x-1/2 -translate-y-1/2">
                {images.map((img, idx) => (
                  <div
                    key={img.url}
                    data-cta-image
                    className={`absolute overflow-hidden rounded-lg shadow-[0_4px_16px_0_rgba(0,0,0,0.18)] ${IMAGE_LAYOUT[idx % IMAGE_LAYOUT.length]}`}
                  >
                    <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="20vw" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CtaCollageClient>
      </div>
    </section>
  );
}
