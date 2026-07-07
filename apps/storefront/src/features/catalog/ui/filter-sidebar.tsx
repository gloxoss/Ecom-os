type Props = {
  minPrice?: number;
  maxPrice?: number;
};

// Price filter sidebar using a native GET form.
// Submitting updates the URL (?min=&max=) — no JS state needed.
export function FilterSidebar({ minPrice, maxPrice }: Props) {
  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <form className="space-y-4 p-4 border border-foreground/10 rounded-md">
        <h2 className="font-bold">Filter by Price</h2>
        <div className="flex gap-2">
          <input
            type="number"
            name="min"
            defaultValue={minPrice}
            placeholder="Min"
            className="w-full p-2 border rounded-md"
          />
          <input
            type="number"
            name="max"
            defaultValue={maxPrice}
            placeholder="Max"
            className="w-full p-2 border rounded-md"
          />
        </div>
        {/* ponytail: native GET form — browser builds the query string automatically */}
        <button
          type="submit"
          className="w-full bg-foreground text-background py-2 rounded-md font-medium"
        >
          Apply
        </button>
      </form>
    </aside>
  );
}
