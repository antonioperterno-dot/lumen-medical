"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CategoryGrid from "@/components/CategoryGrid";
import ResourceCard from "@/components/ResourceCard";
import SearchBar from "@/components/SearchBar";
import { ResourceListSkeleton } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { apiUrl, type ResourcePayload } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/useApiResource";

/**
 * ===========================================================================
 * /categories — Browse
 * ===========================================================================
 * One screen, two modes: the subject grid until you type, then a live search
 * across every resource in Turso. Results are cached per query in the local
 * mirror, so a search you ran on campus still answers in the ward.
 */
export default function CategoriesPage() {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const searching = trimmed.length >= 2;

  const url = useMemo(
    () => (searching ? apiUrl("/api/resources", { q: trimmed, limit: 30 }) : null),
    [searching, trimmed],
  );

  const { data, loading, error, refresh } = useApiResource<ResourcePayload>(url, {
    cacheKey: `search:${trimmed.toLowerCase()}`,
  });

  const results = data?.data ?? [];

  return (
    <div className="space-y-6 px-5 pt-safe">
      <header className="pt-1">
        <SearchBar value={query} onChange={setQuery} />
      </header>

      {searching ? (
        <section className="space-y-3">
          <p className="text-[12px] text-faint">
            {loading && results.length === 0
              ? "Searching…"
              : `${results.length} result${results.length === 1 ? "" : "s"} for “${trimmed}”`}
          </p>

          {loading && results.length === 0 ? (
            <ResourceListSkeleton count={3} />
          ) : error && results.length === 0 ? (
            <ErrorState onRetry={refresh} />
          ) : results.length === 0 ? (
            <EmptyState
              title="Nothing matched"
              message="Try the drug name, the condition, or a symptom. For example: “murmur”, “meningitis” or “adrenaline”."
            />
          ) : (
            <div className="space-y-3">
              {results.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <CategoryGrid limit={50} />

          <section className="space-y-3 pb-2">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-white">Keeping it offline</h2>
                <p className="text-[11px] text-faint">
                  Save first, read anywhere
                </p>
              </div>
              <Link href="/saved" className="text-[12px] font-medium text-lumen">
                Saved
              </Link>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="text-[13px] leading-relaxed text-dim">
                Open any resource and tap{" "}
                <span className="text-white">Save offline</span>. LUMEN then keeps the
                full text on this device.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
