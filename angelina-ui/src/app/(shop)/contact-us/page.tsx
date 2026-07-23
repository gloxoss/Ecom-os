import { ContactHero } from '@/features/contact/ui/contact-hero';
import { ContactInfoSection } from '@/features/contact/ui/contact-info-section';
import { ContactCta } from '@/features/contact/ui/contact-cta';
import contactData from '@/features/contact/data/contact.json';

export const metadata = {
  title: 'Contact Us - Angelina Paris',
  description: "Need help choosing a gift box, tracking an order, or planning a visit to the Maison? We're here to help.",
};

export default function ContactUsPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <ContactHero data={contactData.hero} />
      <ContactInfoSection data={contactData.info} />
      <ContactCta data={contactData.cta} />
    </main>
  );
}
