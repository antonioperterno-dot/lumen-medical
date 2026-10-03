"use client";

import Link from "next/link";
import ProgressRing from "@/components/ProgressRing";
import ResourceCard from "@/components/ResourceCard";
import ScreenHeader from "@/components/ScreenHeader";
import { ResourceListSkeleton, SkeletonBlock } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { ChevronRightIcon, QuizIcon } from "@/components/icons";
import { apiUrl } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/useApiResource";
import { averagePercent } from "@/lib/offline/progress";
import { useProgress } from "@/lib/progress/ProgressProvider";
import type { Category, Resource, ResourceMeta } from "@/lib/types";
import PaperList from "@/components/PaperList";

/**
 * ===========================================================================
 * A single category, e.g. /categories/cardiology
 * ===========================================================================
 * One request returns the resources AND the category index (`include=all`), so
 * the header can show the real name and description without a second round
 * trip. The ring is the average progress across everything in the subject.
 */

type Payload = {
  data: Resource[];
  meta: ResourceMeta & { categories?: Category[]; counts?: Record<string, number> };
};

const TEXTBOOK_LINKS: Record<string, { label: string; url: string }> = {
  pharmacology: { label: "Katzung pharmacology references", url: "https://books.google.com/books?q=Katzung+Basic+%26+Clinical+Pharmacology" },
  psychology: { label: "OpenStax Psychology 2e", url: "https://openstax.org/details/books/psychology-2e" },
  physiology: { label: "OpenStax Anatomy and Physiology", url: "https://openstax.org/details/books/anatomy-and-physiology-2e" },
  anatomy: { label: "OpenStax Anatomy and Physiology", url: "https://openstax.org/details/books/anatomy-and-physiology-2e" },
  "first-aid": { label: "Red Cross first aid resources", url: "https://www.redcross.org/take-a-class/first-aid" },
  nursing: { label: "Nursing textbook references", url: "https://books.google.com/books?q=medical+surgical+nursing+textbook" },
  microbiology: { label: "OpenStax Microbiology 2e", url: "https://openstax.org/details/books/microbiology-2e" },
  "medical-journals": { label: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/" },
};

export default function CategoryScreen({ slug }: { slug: string }) {
  const url = apiUrl("/api/resources", {
    category: slug,
    include: "all",
    limit: 50,
  });
  const { data, loading, error, fromCache, refresh } = useApiResource<Payload>(url, {
    cacheKey: `category:${slug}`,
  });

  // Surfacing the provider here means the ring re-renders as you read.
  const { records } = useProgress();

  const resources = data?.data ?? [];
  const category = data?.meta?.categories?.find((item) => item.slug === slug) ?? null;

  const ids = resources.map((resource) => resource.id);
  const fallbackIds = Object.values(records)
    .filter((record) => record.categorySlug === slug)
    .map((record) => record.resourceId);
  const percent = averagePercent(ids.length ? ids : fallbackIds);

  const title = category?.name ?? slug.replace(/-/g, " ");
  const count = data?.meta?.counts?.[slug] ?? resources.length;

  return (
    <div className="px-5">
      <ScreenHeader
        title={title}
        subtitle={
          category?.description ??
          (count ? `${count} resources` : "Loading subject…")
        }
        back="/categories"
        right={
          <div className="flex items-center gap-2">
            {fromCache && <span className="pill-muted">offline</span>}
            <ProgressRing percent={percent} size={40} stroke={3.5} />
          </div>
        }
      />

      {TEXTBOOK_LINKS[slug] && (
        <a href={TEXTBOOK_LINKS[slug].url} target="_blank" rel="noreferrer" className="mb-4 inline-flex items-center gap-1 text-[12px] font-semibold text-lumen">
          Open {TEXTBOOK_LINKS[slug].label} <ChevronRightIcon className="h-3.5 w-3.5" />
        </a>
      )}

      <div className="mb-5"><PaperList courseUnit={slug} compact /></div>

      <div className="space-y-5">
        {loading && resources.length === 0 ? (
          <ResourceListSkeleton count={4} />
        ) : error && resources.length === 0 ? (
          <ErrorState onRetry={refresh} />
        ) : resources.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            message="This subject has no published resources on this device yet. Reconnect and pull to refresh, or browse another subject."
          />
        ) : (
          <>
            <Link
              href={`/quiz?category=${slug}`}
              className="glass glass-pressable flex items-center gap-3 rounded-2xl p-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-lumen/30 bg-lumen/10 text-lumen">
                <QuizIcon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-white">
                  Quiz me on {title.toLowerCase()}
                </span>
                <span className="block text-[12px] text-dim">
                  Today&apos;s questions for this subject
                </span>
              </span>
            </Link>

            <section className="space-y-3 pb-2">
              <div className="flex items-end justify-between">
                <h2 className="text-[15px] font-semibold text-white">
                  {count} resource{count === 1 ? "" : "s"}
                </h2>
                <span className="text-[11px] text-faint">
                  Trending first
                </span>
              </div>

              {resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </section>
          </>
        )}

        {loading && resources.length > 0 && (
          <SkeletonBlock className="h-10 w-full" rounded="rounded-xl" />
        )}
      </div>
    </div>
  );
}
