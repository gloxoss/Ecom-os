'use client';

import React, { useId, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  buildCatalogUrl,
  clearAllFilters,
  countActiveFilters,
  hasActiveFilters,
  parseCatalogQuery,
  setInStockOnly,
  setPriceRange,
  toggleAttribute,
  toggleBrand,
  toggleCategory,
  type CatalogFacetState,
} from '../model/query-state';

export interface FacetOption {
  value: string;
  label: string;
  count?: number;
}

export interface AttributeFacetGroup {
  name: string;
  label: string;
  options: FacetOption[];
}

export interface CatalogFiltersProps {
  categories?: FacetOption[];
  brands?: FacetOption[];
  attributeFacets?: AttributeFacetGroup[];
  minPriceLimit?: number;
  maxPriceLimit?: number;
  basePath?: string;
  className?: string;
}

export function CatalogFilters({
  categories = [],
  brands = [],
  attributeFacets = [],
  minPriceLimit = 0,
  maxPriceLimit = 1000,
  basePath,
  className = '',
}: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const targetBasePath = basePath ?? (pathname || '/catalog');

  const baseId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [mobileOpen, setMobileOpen] = useState(false);

  const state = parseCatalogQuery(searchParams ? searchParams.toString() : '');
  const [minInput, setMinInput] = useState<string>(
    state.minPrice !== undefined ? String(state.minPrice) : '',
  );
  const [maxInput, setMaxInput] = useState<string>(
    state.maxPrice !== undefined ? String(state.maxPrice) : '',
  );

  function applyState(nextState: CatalogFacetState) {
    const url = buildCatalogUrl(targetBasePath, nextState);
    router.push(url);
  }

  function handleCategoryToggle(value: string) {
    applyState(toggleCategory(state, value));
  }

  function handleBrandToggle(value: string) {
    applyState(toggleBrand(state, value));
  }

  function handleAttributeToggle(name: string, value: string) {
    applyState(toggleAttribute(state, name, value));
  }

  function handleInStockToggle(checked: boolean) {
    applyState(setInStockOnly(state, checked));
  }

  function handlePriceApply(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const min = minInput.trim() ? Number(minInput) : undefined;
    const max = maxInput.trim() ? Number(maxInput) : undefined;
    applyState(setPriceRange(state, min, max));
  }

  function handleClearAll() {
    setMinInput('');
    setMaxInput('');
    applyState(clearAllFilters(state, true));
  }

  const activeCount = countActiveFilters(state);
  const anyActive = hasActiveFilters(state);

  const filterContent = (
    <div className="space-y-6">
      {/* Active filters summary */}
      {anyActive ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
              Active Filters ({activeCount})
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900 underline"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {state.categories.map((catSlug) => {
              const opt = categories.find((c) => c.value === catSlug);
              const label = opt ? opt.label : catSlug;
              return (
                <span
                  key={`cat-${catSlug}`}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs text-neutral-800 border border-neutral-200"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    aria-label={`Remove category filter ${label}`}
                    onClick={() => handleCategoryToggle(catSlug)}
                    className="text-neutral-400 hover:text-neutral-700"
                  >
                    ×
                  </button>
                </span>
              );
            })}

            {state.brands.map((brandSlug) => {
              const opt = brands.find((b) => b.value === brandSlug);
              const label = opt ? opt.label : brandSlug;
              return (
                <span
                  key={`brand-${brandSlug}`}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs text-neutral-800 border border-neutral-200"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    aria-label={`Remove brand filter ${label}`}
                    onClick={() => handleBrandToggle(brandSlug)}
                    className="text-neutral-400 hover:text-neutral-700"
                  >
                    ×
                  </button>
                </span>
              );
            })}

            {(state.minPrice !== undefined || state.maxPrice !== undefined) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs text-neutral-800 border border-neutral-200">
                <span>
                  Price: {state.minPrice !== undefined ? `${state.minPrice} MAD` : '0 MAD'} –{' '}
                  {state.maxPrice !== undefined ? `${state.maxPrice} MAD` : '∞'}
                </span>
                <button
                  type="button"
                  aria-label="Remove price filter"
                  onClick={() => {
                    setMinInput('');
                    setMaxInput('');
                    applyState(setPriceRange(state, undefined, undefined));
                  }}
                  className="text-neutral-400 hover:text-neutral-700"
                >
                  ×
                </button>
              </span>
            )}

            {state.inStockOnly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs text-neutral-800 border border-neutral-200">
                <span>In Stock Only</span>
                <button
                  type="button"
                  aria-label="Remove in-stock filter"
                  onClick={() => handleInStockToggle(false)}
                  className="text-neutral-400 hover:text-neutral-700"
                >
                  ×
                </button>
              </span>
            )}

            {Object.entries(state.attributes).map(([attrName, values]) =>
              values.map((val) => (
                <span
                  key={`attr-${attrName}-${val}`}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs text-neutral-800 border border-neutral-200"
                >
                  <span className="capitalize">{attrName}: {val}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${attrName} filter ${val}`}
                    onClick={() => handleAttributeToggle(attrName, val)}
                    className="text-neutral-400 hover:text-neutral-700"
                  >
                    ×
                  </button>
                </span>
              )),
            )}
          </div>
        </div>
      ) : null}

      {/* Availability */}
      <fieldset className="border-b border-neutral-200 pb-5">
        <legend className="text-sm font-semibold text-neutral-900 mb-3">Availability</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900">
          <input
            type="checkbox"
            checked={Boolean(state.inStockOnly)}
            onChange={(e) => handleInStockToggle(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
          />
          <span>In Stock Only</span>
        </label>
      </fieldset>

      {/* Price Range */}
      <fieldset className="border-b border-neutral-200 pb-5">
        <legend className="text-sm font-semibold text-neutral-900 mb-3">Price Range (MAD)</legend>
        <form onSubmit={handlePriceApply} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor={`min-price-${baseId}`} className="sr-only">
                Minimum price
              </label>
              <input
                id={`min-price-${baseId}`}
                type="number"
                min={minPriceLimit}
                max={maxPriceLimit}
                placeholder="Min"
                value={minInput}
                onChange={(e) => setMinInput(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 outline-none focus:border-neutral-900"
              />
            </div>
            <span className="text-neutral-400" aria-hidden="true">
              –
            </span>
            <div className="flex-1">
              <label htmlFor={`max-price-${baseId}`} className="sr-only">
                Maximum price
              </label>
              <input
                id={`max-price-${baseId}`}
                type="number"
                min={minPriceLimit}
                max={maxPriceLimit}
                placeholder="Max"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 outline-none focus:border-neutral-900"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-neutral-900 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
          >
            Apply Price
          </button>
        </form>
      </fieldset>

      {/* Categories */}
      {categories.length > 0 ? (
        <fieldset className="border-b border-neutral-200 pb-5">
          <legend className="text-sm font-semibold text-neutral-900 mb-3">Categories</legend>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {categories.map((cat) => {
              const isChecked = state.categories.includes(cat.value);
              return (
                <label
                  key={cat.value}
                  className="flex cursor-pointer items-center justify-between text-sm text-neutral-700 hover:text-neutral-900"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCategoryToggle(cat.value)}
                      className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                    />
                    <span>{cat.label}</span>
                  </div>
                  {cat.count !== undefined ? (
                    <span className="text-xs text-neutral-400">{`(${cat.count})`}</span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {/* Brands */}
      {brands.length > 0 ? (
        <fieldset className="border-b border-neutral-200 pb-5">
          <legend className="text-sm font-semibold text-neutral-900 mb-3">Brands</legend>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {brands.map((b) => {
              const isChecked = state.brands.includes(b.value);
              return (
                <label
                  key={b.value}
                  className="flex cursor-pointer items-center justify-between text-sm text-neutral-700 hover:text-neutral-900"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleBrandToggle(b.value)}
                      className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                    />
                    <span>{b.label}</span>
                  </div>
                  {b.count !== undefined ? (
                    <span className="text-xs text-neutral-400">{`(${b.count})`}</span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {/* Attribute Facet Groups */}
      {attributeFacets.map((group) => {
        const currentVals = state.attributes[group.name.toLowerCase()] ?? [];
        return (
          <fieldset key={group.name} className="border-b border-neutral-200 pb-5">
            <legend className="text-sm font-semibold text-neutral-900 mb-3">{group.label}</legend>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {group.options.map((opt) => {
                const isChecked = currentVals.includes(opt.value.toLowerCase());
                return (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center justify-between text-sm text-neutral-700 hover:text-neutral-900"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleAttributeToggle(group.name, opt.value)}
                        className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                      <span>{opt.label}</span>
                    </div>
                    {opt.count !== undefined ? (
                      <span className="text-xs text-neutral-400">{`(${opt.count})`}</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );

  return (
    <aside aria-label="Catalog filters" className={`catalog-filters ${className}`}>
      {/* Mobile filter trigger button */}
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50"
        >
          <span>Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs text-white">
              {activeCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">{filterContent}</div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter products"
          className="fixed inset-0 z-[1200] flex flex-col bg-white lg:hidden"
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <h2 className="text-base font-semibold">
              Filters {activeCount > 0 ? `(${activeCount})` : ''}
            </h2>
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setMobileOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-lg hover:bg-neutral-100"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">{filterContent}</div>
          <div className="border-t border-neutral-200 bg-white p-4">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="w-full rounded-md bg-neutral-900 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Show Results
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
