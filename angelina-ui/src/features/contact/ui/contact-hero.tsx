import Image from 'next/image';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Reveal } from '@/features/landing/ui/reveal';
import { ContactFormClient } from './contact-form-client';

interface ContactHeroProps {
  data: {
    title: string;
    description: string;
    email: string;
    phone: string;
    image: { url: string; alt: string };
    locationsLabel: string;
    locations: string[];
    form: {
      fields: Record<'firstName' | 'lastName' | 'email' | 'phone' | 'message', string>;
      placeholders: Record<'firstName' | 'lastName' | 'email' | 'phone' | 'message', string>;
      submit: string;
      success: string;
      error: string;
    };
  };
}

export function ContactHero({ data }: ContactHeroProps) {
  const { title, description, email, phone, image, locationsLabel, locations, form } = data;

  return (
    <section className="bg-background pt-[120px] md:pt-[155px] pb-20 md:pb-25">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        {/* Top: heading + quick contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mb-16 md:mb-20">
          <h1 data-reveal className="font-heading text-[38px] md:text-[48px] lg:text-[56px] leading-[1.1] tracking-tight text-foreground">
            {title}
          </h1>
          <div data-reveal className="flex flex-col gap-6 md:justify-self-end md:text-right">
            <p className="font-body text-base md:text-lg leading-[1.4] text-foreground/70 max-w-[420px] md:ml-auto">
              {description}
            </p>
            <div className="flex flex-col gap-2 md:items-end">
              <a href={`mailto:${email}`} className="inline-flex items-center gap-2 font-body text-sm text-foreground hover:text-primary transition-colors duration-300">
                <Mail size={16} strokeWidth={1.75} />
                {email}
              </a>
              <a href={`tel:${phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 font-body text-sm text-foreground hover:text-primary transition-colors duration-300">
                <Phone size={16} strokeWidth={1.75} />
                {phone}
              </a>
            </div>
          </div>
        </div>

        {/* Bottom: image + locations card | contact form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div data-reveal className="relative overflow-hidden rounded-2xl min-h-[360px] md:min-h-[460px]">
            <Image src={image.url} alt={image.alt} fill sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" />
            <div className="absolute left-5 bottom-5 right-5 md:right-auto md:w-[260px] rounded-2xl bg-background/90 backdrop-blur-sm p-6 flex flex-col gap-4">
              <p className="font-body text-[11px] font-bold uppercase tracking-[0.25em] text-foreground">
                {locationsLabel}
              </p>
              <ul className="flex flex-col gap-3">
                {locations.map((address) => (
                  <li key={address} className="flex items-start gap-2 font-body text-xs text-foreground/70 leading-[1.4]">
                    <MapPin size={14} strokeWidth={1.75} className="shrink-0 mt-0.5 text-primary" />
                    {address}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div data-reveal className="rounded-2xl bg-input p-6 md:p-8">
            <ContactFormClient fields={form.fields} placeholders={form.placeholders} submitLabel={form.submit} successMessage={form.success} errorMessage={form.error} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
