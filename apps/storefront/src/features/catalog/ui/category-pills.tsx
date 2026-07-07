import Link from 'next/link';

type Category = { id: string; slug: string; name: string };

type Props = {
  categories: Category[];
  // The slug of the currently active category, if any
  activeSlug?: string;
};

// Row of pill links for filtering by category.
// "All" is always shown first and is active when no slug is set.
export function CategoryPills({ categories, activeSlug }: Props) {
  if (!categories.length) return null;

  const pillClass = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm transition ${
      active
        ? 'bg-foreground text-background'
        : 'border border-foreground/20 hover:bg-muted'
    }`;

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <Link href="/catalog" className={pillClass(!activeSlug)}>
        All
      </Link>
      {categories.map(c => (
        <Link key={c.id} href={`/catalog/${c.slug}`} className={pillClass(activeSlug === c.slug)}>
          {c.name}
        </Link>
      ))}
    </div>
  );
}
