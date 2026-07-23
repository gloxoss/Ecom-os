import { AboutHero } from '@/features/about/ui/about-hero';
import { AboutStory } from '@/features/about/ui/about-story';
import { AboutJourney } from '@/features/about/ui/about-journey';
import { AboutCollection } from '@/features/about/ui/about-collection';
import { AboutTeam } from '@/features/about/ui/about-team';
import { AboutFaq } from '@/features/about/ui/about-faq';
import { LocationSection } from '@/components/shared/location-section';
import aboutData from '@/features/about/data/about.json';

export const metadata = {
  title: 'About Us - Angelina Paris',
  description: 'The story, the craft, and the team behind the Maison — a Paris salon for hot chocolate, pastry, and quiet celebration.',
};

export default function AboutUsPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <AboutHero data={aboutData.hero} />
      <AboutStory data={aboutData.story} />
      <AboutJourney data={aboutData.journey} />
      <AboutCollection data={aboutData.collection} />
      <AboutTeam data={aboutData.team} />
      <AboutFaq data={aboutData.faq} />
      <LocationSection data={aboutData.location} />
    </main>
  );
}
