'use client';

import React from 'react';
import { SearchAutocomplete } from './search-autocomplete';
import { defaultFetchSuggestions } from './fetch-suggestions';

export interface SearchBarProps {
  placeholder?: string;
  initialQuery?: string;
}

export function SearchBar({
  placeholder,
}: SearchBarProps) {
  return (
    <div className="w-full max-w-lg">
      <SearchAutocomplete
        fetchSuggestions={defaultFetchSuggestions}
        placeholder={placeholder}
      />
    </div>
  );
}
