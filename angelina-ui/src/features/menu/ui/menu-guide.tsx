import Image from 'next/image';
import { Reveal } from '@/features/landing/ui/reveal';
import { RollLink } from '@/components/shared/roll-link';

interface GuideData {
  subtitle: string;
  title: string;
  images: { url: string; alt: string }[];
  features: { title: string; description: string }[];
  button: { text: string; href: string };
}

const FEATURE_ICONS = [
  '/assets/beano/aHR0cHM6_69b0740dac5f2061419609e8_Frame (2).svg',
  '/assets/beano/aHR0cHM6_69b127348d1353eb0b38cef9_Frame (3).svg',
  '/assets/beano/aHR0cHM6_69b130ad5c9f43dcd5ff67c1_Frame (4).svg',
  '/assets/beano/aHR0cHM6_697881b1d479d8e7dc13db98_Frame (2).svg',
];

export function MenuGuide({ data }: { data: GuideData }) {
  const { subtitle, title, images, features, button } = data;

  return (
    <section className="bg-input py-20 md:py-28">
      <Reveal className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-start gap-12 md:gap-16 lg:gap-24">
          {/* Left: single signature shot */}
          <div data-reveal-left className="relative shrink-0 w-full max-w-[340px] aspect-[4/5] mx-auto md:mx-0 overflow-hidden rounded-2xl">
            <Image
              src={images[0].url}
              alt={images[0].alt}
              fill
              sizes="(max-width: 767px) 100vw, 340px"
              className="object-cover"
            />
          </div>

          {/* Right: subtitle, heading, features grid, button */}
          <div className="flex-1 flex flex-col gap-10 min-w-0">
            <div className="flex flex-col gap-5">
              <p data-reveal className="font-body text-sm font-medium uppercase tracking-[1.4px] text-foreground">
                {subtitle}
              </p>
              <h2 data-reveal className="font-heading text-[32px] md:text-[40px] leading-[1.2] tracking-[-1px] text-foreground max-w-xl">
                {title}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
              {features.map((feature, idx) => (
                <div data-reveal key={feature.title} className="flex flex-col gap-3">
                  <Image src={FEATURE_ICONS[idx % FEATURE_ICONS.length]} alt="" width={22} height={22} />
                  <p className="font-body text-sm font-medium uppercase tracking-[1.4px] text-foreground">
                    {feature.title}
                  </p>
                  <p className="font-body text-base leading-[1.4] text-foreground/60">{feature.description}</p>
                </div>
              ))}
            </div>

            <div data-reveal>
              <RollLink href={button.href} label={button.text} variant="dark" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
