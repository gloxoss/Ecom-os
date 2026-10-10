import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { SearchAutocomplete } from "./search-autocomplete";

describe("search autocomplete accessible markup", () => {
  it("renders a combobox with listbox wiring and a mobile dialog trigger", () => {
    const html = renderToString(
      React.createElement(SearchAutocomplete, {
        fetchSuggestions: async () => ({
          products: [],
          categories: [],
          brands: [],
        }),
      }),
    );
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-autocomplete="list"');
    expect(html).toContain("aria-controls");
    expect(html).toContain('role="search"');
    expect(html).toContain("Open search");
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain('role="dialog"');
  });

  it("announces grouped suggestion kinds in the listbox", async () => {
    const { flattenSuggestions } = await import("./types");
    const flat = flattenSuggestions({
      products: [
        { id: "p1", kind: "product", label: "Scalpel", href: "/p/scalpel" },
      ],
      categories: [
        { id: "c1", kind: "category", label: "Surgery", href: "/c/surgery" },
      ],
      brands: [{ id: "b1", kind: "brand", label: "MediCo", href: "/b/medico" }],
    });
    expect(flat.map((item) => item.kind)).toEqual([
      "product",
      "category",
      "brand",
    ]);
  });
});
