"use client";

import GlassCard from "@/components/GlassCard";
import ProgressRing from "@/components/ProgressRing";
import { ChevronRightIcon } from "@/components/icons";
import { useProgress } from "@/lib/progress/ProgressProvider";
import type { Category, Resource } from "@/lib/types";
import { averagePercent } from "@/lib/offline/progress";
import { FirstAidCaseIcon, VirusIcon } from "@/components/icons";

const TEXTBOOK_LINKS: Record<string, string> = {
  pharmacology: "https://books.google.com/books?q=Katzung+Basic+%26+Clinical+Pharmacology",
  psychology: "https://books.google.com/books?q=medical+psychology+textbook",
  physiology: "https://openstax.org/details/books/anatomy-and-physiology-2e",
  anatomy: "https://openstax.org/details/books/anatomy-and-physiology-2e",
  "first-aid": "https://www.redcross.org/take-a-class/first-aid",
  nursing: "https://books.google.com/books?q=medical+surgical+nursing+textbook",
  microbiology: "https://openstax.org/details/books/microbiology-2e",
  "medical-journals": "https://pubmed.ncbi.nlm.nih.gov/",
};

/**
 * CategoryTile — one of the seven tiles on the home screen.
 * The ring shows the average progress across that category's resources, so a
 * student can see at a glance which subject they have been neglecting.
 */
export default function CategoryTile({
  category,
  counts,
  resources,
  href,
}: {
  category: Category;
  counts?: Record<string, number>;
  /** Resources in this category, used to average the ring. */
  resources?: Resource[];
  href?: string;
}) {
  // Subscribing to the provider keeps the ring in step with local writes.
  const { records } = useProgress();

  const ids = (resources ?? [])
    .filter((resource) => resource.category_slug === category.slug)
    .map((resource) => resource.id);

  // Fall back to every stored record for the category when the resource list
  // has not been fetched yet (e.g. an offline cold start).
  const percent = ids.length
    ? averagePercent(ids)
    : averagePercent(
        Object.values(records)
          .filter((record) => record.categorySlug === category.slug)
          .map((record) => record.resourceId),
      );

  const count = counts?.[category.slug];

  return (
    <GlassCard href={href ?? `/categories/${category.slug}`} padded={false}>
      <div className="flex h-full flex-col justify-between gap-4 p-4">
        <div className="flex items-start justify-between">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
            style={{
              background: "rgba(57,255,136,0.12)",
              border: "1px solid rgba(57,255,136,0.28)",
            }}
            aria-hidden
          >
            {category.slug === "microbiology" ? (
              <VirusIcon className="h-5 w-5" />
            ) : category.slug === "first-aid" ? (
              <FirstAidCaseIcon className="h-6 w-6" />
            ) : (
              category.icon ?? "📘"
            )}
          </span>
          <ProgressRing percent={percent} size={40} stroke={3.5} />
        </div>

        <div>
          <h3 className="break-words text-[14px] font-semibold leading-tight text-white sm:text-[15px]">
            {category.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-dim">
            {category.description}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-faint">
              {typeof count === "number" ? `${count} resources` : "Browse"}
            </span>
            <ChevronRightIcon className="h-4 w-4 text-faint" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
