// Single skeleton card shown while a product is loading.
// animate-pulse makes the whole block fade in/out repeatedly.
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Image placeholder — same 4:5 ratio as the real product image */}
      <div className="aspect-[4/5] bg-muted rounded-lg mb-4" />
      {/* Product name placeholder — 3/4 width to look like a title */}
      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
      {/* Price placeholder — 1/4 width to look like a short number */}
      <div className="h-4 bg-muted rounded w-1/4" />
    </div>
  );
}

// Grid of skeleton cards shown while the full product list is loading.
// count controls how many placeholders to render (default: 8).
// Array.from with a map function creates `count` items in one pass — no .map() needed.
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
