'use client';

import React from 'react';
import type { Product, Variation } from '@ecom-os/engine';

interface VariationSelectorProps {
  product: Product;
  selectedAttributes: Record<string, string>;
  onSelectAttribute: (attributeName: string, value: string) => void;
  className?: string;
}

interface AttributeGroup {
  name: string;
  label: string;
  values: string[];
}

export function extractAttributeGroups(product: Product): AttributeGroup[] {
  const variations = product.variations || product.variants || [];
  const groupMap = new Map<string, { label: string; values: Set<string> }>();

  // If product has explicit attributes
  if (product.attributes && product.attributes.length > 0) {
    for (const attr of product.attributes) {
      if (attr.options && attr.options.length > 0) {
        groupMap.set(attr.name, {
          label: attr.label || attr.name,
          values: new Set(attr.options),
        });
      }
    }
  }

  // Also collect from variations
  for (const v of variations) {
    for (const a of v.attributes || []) {
      if (!groupMap.has(a.name)) {
        groupMap.set(a.name, {
          label: a.label || a.name,
          values: new Set(),
        });
      }
      groupMap.get(a.name)!.values.add(a.value);
    }
  }

  return Array.from(groupMap.entries()).map(([name, data]) => ({
    name,
    label: data.label,
    values: Array.from(data.values),
  }));
}

export function isCombinationAvailable(
  variations: Variation[],
  attributeName: string,
  value: string,
  currentSelections: Record<string, string>
): boolean {
  if (!variations || variations.length === 0) return true;

  const testSelections = { ...currentSelections, [attributeName]: value };

  return variations.some((v) => {
    // Check if this variation matches all currently selected attributes
    const matchesCurrent = Object.entries(testSelections).every(([k, val]) => {
      const matchAttr = v.attributes?.find((a) => a.name === k || a.label === k);
      return !matchAttr || matchAttr.value.toLowerCase() === val.toLowerCase();
    });

    if (!matchesCurrent) return false;

    // Check if variation is in stock
    const isOutOfStock = v.inventory?.status === 'OUT_OF_STOCK' || v.isPurchasable === false;
    return !isOutOfStock;
  });
}

export function VariationSelector({
  product,
  selectedAttributes,
  onSelectAttribute,
  className = '',
}: VariationSelectorProps) {
  const variations = product.variations || product.variants || [];
  if (variations.length === 0) return null;

  const groups = extractAttributeGroups(product);
  if (groups.length === 0) return null;

  return (
    <div className={`flex flex-col gap-5 ${className}`} aria-label="Product options">
      {groups.map((group) => {
        const selectedValue = selectedAttributes[group.name];

        return (
          <fieldset
            key={group.name}
            className="flex flex-col gap-2.5 border-0 p-0 m-0"
            role="radiogroup"
            aria-labelledby={`group-label-${group.name}`}
          >
            <div className="flex items-center justify-between">
              <legend
                id={`group-label-${group.name}`}
                className="font-body text-xs font-semibold uppercase tracking-[1.2px] text-foreground"
              >
                {group.label}
              </legend>
              {selectedValue && (
                <span className="font-body text-xs text-foreground/60" aria-live="polite">
                  {selectedValue}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2" role="presentation">
              {group.values.map((val) => {
                const isSelected = selectedValue?.toLowerCase() === val.toLowerCase();
                const available = isCombinationAvailable(variations, group.name, val, selectedAttributes);

                return (
                  <button
                    key={val}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={!available}
                    onClick={() => onSelectAttribute(group.name, val)}
                    className={`inline-flex items-center justify-center min-w-[48px] min-h-[44px] px-4 py-2.5 rounded-md font-body text-xs font-medium uppercase tracking-[0.5px] transition-all focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none motion-reduce:transition-none cursor-pointer ${
                      isSelected
                        ? 'bg-foreground text-background shadow-sm border border-foreground'
                        : available
                        ? 'bg-background text-foreground border border-border hover:border-foreground/60 hover:bg-muted/50'
                        : 'bg-muted/30 text-foreground/30 border border-border/40 cursor-not-allowed line-through'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

