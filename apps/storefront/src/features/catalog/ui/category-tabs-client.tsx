'use client';

import { useRouter } from 'next/navigation';
import { ProductTabsClient, type ProductTab } from '@/components/shared/product-tabs-client';

interface CategoryTabsClientProps {
  tabs: ProductTab[];
  initialActiveId: string;
  /** Maps a tab's internal id (e.g. category `id`) to its `?category=` query value. */
  idToParam: Record<string, string>;
}

/**
 * Wraps the shared ProductTabsClient for the /catalog product grid: selecting
 * a tab updates `?category=` in place (same route, no server refetch, no
 * scroll jump) so the filter is reflected in a shareable URL. Purely a
 * client-side history update — no navigation, no page "refresh" feel.
 */
export function CategoryTabsClient({ tabs, initialActiveId, idToParam }: CategoryTabsClientProps) {
  const router = useRouter();

  const handleActiveChange = (id: string) => {
    const value = idToParam[id] ?? 'all';
    const url = value === 'all' ? '/catalog' : `/catalog?category=${value}`;
    router.replace(url, { scroll: false });
  };

  return (
    <ProductTabsClient
      tabs={tabs}
      size="md"
      withDivider
      initialActiveId={initialActiveId}
      onActiveChange={handleActiveChange}
    />
  );
}
