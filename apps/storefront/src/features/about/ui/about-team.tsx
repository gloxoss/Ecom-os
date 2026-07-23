import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/features/landing/ui/reveal';

interface AboutTeamProps {
  data: {
    label: string;
    title: string;
    members: { name: string; role: string; image: { url: string; alt: string } }[];
  };
}

export function AboutTeam({ data }: AboutTeamProps) {
  const { label, title, members } = data;

  return (
    <section className="bg-input py-20 md:py-25">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="flex flex-col items-center text-center gap-5 max-w-[640px] mx-auto mb-14 md:mb-16">
          <p data-reveal className="font-body text-sm font-medium uppercase tracking-[1.4px] text-foreground">
            {label}
          </p>
          <h2 data-reveal className="font-heading text-[28px] md:text-[36px] leading-[1.25] tracking-[-1px] text-foreground">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {members.map((member) => (
            <div data-reveal key={member.name} className="flex flex-col gap-3">
              <div className="group relative overflow-hidden rounded-2xl aspect-3/4">
                <Image
                  src={member.image.url}
                  alt={member.image.alt}
                  fill
                  sizes="(max-width: 767px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.08]"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors duration-300" />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground">
                    <ArrowUpRight size={14} strokeWidth={1.75} />
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="font-body text-sm font-medium text-foreground">{member.name}</p>
                <p className="font-body text-xs text-foreground/60">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
