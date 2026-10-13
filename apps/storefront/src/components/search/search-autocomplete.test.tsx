import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
// Imported by path rather than through the workspace link so the test always
// reads this checkout's catalogue, edited or not.
import enMessages from "../../../../../packages/addons-i18n/locales/en.json";
import frMessages from "../../../../../packages/addons-i18n/locales/fr.json";
import { SearchAutocomplete } from "./search-autocomplete";

const emptySuggestions = async () => ({
  products: [],
  categories: [],
  brands: [],
});

type SearchProps = Partial<React.ComponentProps<typeof SearchAutocomplete>>;

function renderSearch(
  locale: string,
  messages: AbstractIntlMessages,
  props: SearchProps = {},
): string {
  return renderToString(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SearchAutocomplete fetchSuggestions={emptySuggestions} {...props} />
    </NextIntlClientProvider>,
  );
}

describe("search autocomplete accessible markup and behavior", () => {
  it("renders a combobox with listbox wiring and a mobile dialog trigger", () => {
    const html = renderSearch("en", enMessages);
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

  it("renders with popular searches prop", () => {
    const html = renderSearch("en", enMessages, {
      popularSearches: ["Safran pur", "Eau de rose"],
    });
    expect(html).toContain('role="combobox"');
  });

  it("renders with isOffline prop enabled", () => {
    const html = renderSearch("en", enMessages, { isOffline: true });
    expect(html).toContain('role="combobox"');
  });

  it("supports French diacritic tolerance in queries", async () => {
    const { normalizeText } = await import("./recent-searches");
    const term1 = normalizeText("Élixir Végétal");
    const term2 = normalizeText("elixir vegetal");
    expect(term1).toBe(term2);
  });
});

describe("search box is translatable (ECO-1502)", () => {
  it("takes the submit button and labels from the English catalogue, not from component source", () => {
    const html = renderSearch("en", enMessages);
    // The button used to be the literal string "Search" in the component; it now
    // comes from the catalogue, so a locale change moves it.
    expect(html).toContain(">Search<");
    expect(html).toContain("Search products, categories, brands");
    expect(html).toContain("Search the catalog");
  });

  it("renders French copy for the French locale with no component change", () => {
    const html = renderSearch("fr", frMessages);
    expect(html).toContain(">Rechercher<");
    expect(html).toContain("Rechercher des produits, catégories, marques");
    expect(html).toContain("Rechercher dans le catalogue");
    expect(html).toContain("Ouvrir la recherche");
    expect(html).not.toContain(">Search<");
  });

  it("still lets a caller override copy it already translates", () => {
    const html = renderSearch("fr", frMessages, {
      placeholder: "Chercher un article",
      inputLabel: "Champ de recherche",
    });
    expect(html).toContain("Chercher un article");
    expect(html).toContain("Champ de recherche");
  });
});
