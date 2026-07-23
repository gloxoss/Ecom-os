import { MenuHero } from '@/features/menu/ui/menu-hero';
import { MenuCatalog } from '@/features/menu/ui/menu-catalog';
import { MenuGuide } from '@/features/menu/ui/menu-guide';
import { MenuCta } from '@/features/menu/ui/menu-cta';
import menuData from '@/features/menu/data/menu.json';

export const metadata = {
  title: 'Our Menu - Angelina Paris',
  description: 'Explore our full Maison menu: signature hot chocolate, Mont-Blanc, fine teas, chocolates, and giftable sweets.',
};

export default function MenuPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <MenuHero data={menuData.hero} />
      <MenuCatalog />
      <MenuGuide data={menuData.guide} />
      <MenuCta data={menuData.cta} />
    </main>
  );
}
