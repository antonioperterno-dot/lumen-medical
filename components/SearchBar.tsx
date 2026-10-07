"use client";

import { SearchIcon, CloseIcon } from "@/components/icons";

/**
 * SearchBar — used on /categories and inside a category.
 * Purely presentational: the parent owns the debounced query so it can drive
 * the fetch, the cache key and the skeleton state in one place.
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = "Search topics, e.g. STEMI, murmur, malaria",
  onSubmit,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}) {
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
      className="relative"
    >
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search resources"
        className="glass-input w-full rounded-xl border border-white/10 py-3 pl-10 pr-10 text-[14px] text-white placeholder:text-faint focus:border-lumen/40 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-faint active:text-white"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
