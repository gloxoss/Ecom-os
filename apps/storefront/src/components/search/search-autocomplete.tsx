"use client";

import React, { useId, useMemo, useRef, useState } from "react";
import { useDebouncedSuggestions } from "./use-debounced-suggestions";
import {
  countSuggestions,
  flattenSuggestions,
  isEmptyGroups,
  suggestionOptionId,
  type Suggestion,
  type SuggestionFetcher,
  type SuggestionGroups,
} from "./types";
import { moveActiveIndex } from "./keyboard-nav";

export interface SearchAutocompleteProps {
  fetchSuggestions: SuggestionFetcher;
  onSelect?: (suggestion: Suggestion) => void;
  placeholder?: string;
  debounceMs?: number;
  minQueryLength?: number;
  searchHref?: (query: string) => string;
  inputLabel?: string;
}

function GroupSection({
  title,
  items,
  listId,
  startIndex,
  activeIndex,
  onPick,
}: {
  title: string;
  items: Suggestion[];
  listId: string;
  startIndex: number;
  activeIndex: number;
  onPick: (suggestion: Suggestion) => void;
}) {
  if (items.length === 0) return null;
  return (
    <li role="presentation" className="px-2 pt-2 first:pt-1">
      <p
        role="presentation"
        className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500"
      >
        {title}
      </p>
      <ul role="group" aria-label={title} className="flex flex-col gap-0.5">
        {items.map((item, offset) => {
          const index = startIndex + offset;
          const active = index === activeIndex;
          return (
            <li
              key={`${item.kind}-${item.id}`}
              id={suggestionOptionId(listId, index)}
              role="option"
              aria-selected={active}
              data-active={active ? "true" : undefined}
              className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors motion-reduce:transition-none ${
                active ? "bg-neutral-900 text-white" : "text-neutral-900 hover:bg-neutral-100"
              }`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPick(item)}
            >
              {item.thumbnailUrl ? (
                // Plain img keeps the suggestion UI free of remote-image config.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnailUrl}
                  alt=""
                  aria-hidden="true"
                  className="h-8 w-8 flex-none rounded object-cover"
                />
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{item.label}</span>
                {item.hint ? (
                  <span
                    className={`block truncate text-xs ${active ? "text-white/80" : "text-neutral-500"}`}
                  >
                    {item.hint}
                  </span>
                ) : null}
              </span>
              <span
                aria-hidden="true"
                className={`flex-none text-[11px] uppercase tracking-wider ${active ? "text-white/70" : "text-neutral-400"}`}
              >
                {item.kind}
              </span>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

function SuggestionList({
  listId,
  groups,
  activeIndex,
  onPick,
}: {
  listId: string;
  groups: SuggestionGroups;
  activeIndex: number;
  onPick: (suggestion: Suggestion) => void;
}) {
  const productStart = 0;
  const categoryStart = groups.products.length;
  const brandStart = categoryStart + groups.categories.length;
  return (
    <ul
      id={listId}
      role="listbox"
      aria-label="Search suggestions"
      className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto p-1"
    >
      <GroupSection
        title="Products"
        items={groups.products}
        listId={listId}
        startIndex={productStart}
        activeIndex={activeIndex}
        onPick={onPick}
      />
      <GroupSection
        title="Categories"
        items={groups.categories}
        listId={listId}
        startIndex={categoryStart}
        activeIndex={activeIndex}
        onPick={onPick}
      />
      <GroupSection
        title="Brands"
        items={groups.brands}
        listId={listId}
        startIndex={brandStart}
        activeIndex={activeIndex}
        onPick={onPick}
      />
    </ul>
  );
}

export function SearchAutocomplete({
  fetchSuggestions,
  onSelect,
  placeholder = "Search products, categories, brands",
  debounceMs,
  minQueryLength,
  searchHref = (query) => `/search?q=${encodeURIComponent(query)}`,
  inputLabel = "Search the catalog",
}: SearchAutocompleteProps) {
  const { query, setQuery, snapshot, retry, clear } =
    useDebouncedSuggestions({ fetchSuggestions, debounceMs, minQueryLength });
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const baseId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const listId = `search-suggestions-${baseId}`;
  const mobileListId = `search-suggestions-mobile-${baseId}`;
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const flat = useMemo(() => flattenSuggestions(snapshot.groups), [snapshot.groups]);
  const total = flat.length;
  const showPanel = open && query.trim().length >= 2;

  function pick(suggestion: Suggestion): void {
    setOpen(false);
    setMobileOpen(false);
    if (onSelect) {
      onSelect(suggestion);
      return;
    }
    window.location.assign(suggestion.href);
  }

  function submitFullSearch(): void {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    setOpen(false);
    setMobileOpen(false);
    window.location.assign(searchHref(trimmed));
  }

  function handleInputKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const navKey = event.key as "ArrowDown" | "ArrowUp";
      event.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((current) =>
        moveActiveIndex(current, navKey, total),
      );
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      const navKey = event.key as "Home" | "End";
      if (!open || total === 0) return;
      event.preventDefault();
      setActiveIndex((current) => moveActiveIndex(current, navKey, total));
      return;
    }
    if (event.key === "Enter") {
      if (open && activeIndex >= 0 && activeIndex < total) {
        event.preventDefault();
        pick(flat[activeIndex]);
        return;
      }
      return;
    }
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        setActiveIndex(-1);
      } else if (mobileOpen) {
        setMobileOpen(false);
      }
      return;
    }
  }

  function renderPanelState(currentListId: string) {
    if (snapshot.status === "loading") {
      return (
        <p role="status" className="px-4 py-6 text-sm text-neutral-600">
          Searching…
        </p>
      );
    }
    if (snapshot.status === "error") {
      return (
        <div role="alert" className="flex flex-col gap-2 px-4 py-6">
          <p className="text-sm text-neutral-900">
            Search is unavailable right now.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveIndex(-1);
              retry();
            }}
            className="w-fit rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100"
          >
            Retry
          </button>
        </div>
      );
    }
    if (snapshot.status === "rate-limited") {
      return (
        <div role="alert" className="flex flex-col gap-2 px-4 py-6">
          <p className="text-sm text-neutral-900">
            Too many searches in a short time. Please wait a moment.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveIndex(-1);
              retry();
            }}
            className="w-fit rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100"
          >
            Try again
          </button>
        </div>
      );
    }
    if (snapshot.status === "ready" && isEmptyGroups(snapshot.groups)) {
      return (
        <p role="status" className="px-4 py-6 text-sm text-neutral-600">
          No matches for “{snapshot.query}”. Try a full product name, SKU, category, or brand.
        </p>
      );
    }
    if (snapshot.status === "ready") {
      return (
        <SuggestionList
          listId={currentListId}
          groups={snapshot.groups}
          activeIndex={activeIndex}
          onPick={pick}
        />
      );
    }
    return (
      <p role="status" className="px-4 py-6 text-sm text-neutral-600">
        Type at least 2 characters to see products, categories, and brands.
      </p>
    );
  }

  function renderField(autoFocus: boolean, currentListId: string, fieldId: string) {
    const activeId =
      open && activeIndex >= 0 && activeIndex < total
        ? suggestionOptionId(currentListId, activeIndex)
        : undefined;
    return (
      <form
        role="search"
        aria-label={inputLabel}
        onSubmit={(event) => {
          event.preventDefault();
          if (open && activeIndex >= 0 && activeIndex < total) {
            pick(flat[activeIndex]);
          } else {
            submitFullSearch();
          }
        }}
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={autoFocus ? mobileInputRef : undefined}
              id={fieldId}
              type="search"
              autoComplete="off"
              autoFocus={autoFocus}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
                setActiveIndex(-1);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                window.setTimeout(() => setOpen(false), 120);
              }}
              onKeyDown={(event) => handleInputKeyDown(event)}
              placeholder={placeholder}
              role="combobox"
              aria-expanded={showPanel}
              aria-controls={currentListId}
              aria-activedescendant={activeId}
              aria-autocomplete="list"
              aria-label={inputLabel}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-500 focus:border-neutral-900"
            />
            {query.length > 0 ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  clear();
                  setActiveIndex(-1);
                  setOpen(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1 text-sm text-neutral-500 hover:text-neutral-900"
              >
                ×
              </button>
            ) : null}
          </div>
          <button
            type="submit"
            className="flex-none rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Search
          </button>
        </div>
        {showPanel ? (
          <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
            {renderPanelState(currentListId)}
            {snapshot.status === "ready" && !isEmptyGroups(snapshot.groups) ? (
              <button
                type="button"
                onClick={submitFullSearch}
                className="w-full border-t border-neutral-100 px-4 py-2 text-left text-xs font-medium text-neutral-600 hover:bg-neutral-50"
              >
                See all {countSuggestions(snapshot.groups)} results for “{query.trim()}” →
              </button>
            ) : null}
          </div>
        ) : null}
      </form>
    );
  }

  return (
    <div className="search-autocomplete">
      <div className="relative hidden md:block">
        {renderField(false, listId, `site-search-${baseId}`)}
      </div>

      <div className="md:hidden">
        <button
          type="button"
          aria-label="Open search"
          aria-haspopup="dialog"
          onClick={() => {
            setMobileOpen(true);
            setOpen(true);
            window.setTimeout(() => mobileInputRef.current?.focus(), 30);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-current"
        >
          <span aria-hidden="true">⌕</span>
        </button>
      </div>

      {mobileOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={inputLabel}
          className="fixed inset-0 z-[1100] flex flex-col bg-white md:hidden"
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <p className="text-sm font-semibold uppercase tracking-widest">Search</p>
            <button
              type="button"
              aria-label="Close search"
              onClick={() => {
                setMobileOpen(false);
                setOpen(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-lg"
            >
              ×
            </button>
          </div>
          <div className="relative flex-1 overflow-y-auto px-4 py-4">
            {renderField(true, mobileListId, `site-search-mobile-${baseId}`)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
