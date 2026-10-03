import { cn } from "@/lib/utils";

/**
 * ===========================================================================
 * Skeletons
 * ===========================================================================
 * Every fetch in LUMEN renders one of these while it is in flight. The shimmer
 * comes from the `.skeleton` class in globals.css (a sweeping green-tinted
 * gradient), which is disabled automatically for students who have "Reduce
 * Motion" switched on in iOS.
 */

/** A single shimmering block. */
export function SkeletonBlock({
  className,
  rounded = "rounded-lg",
}: {
  className?: string;
  rounded?: string;
}) {
  return <div className={cn("skeleton", rounded, className)} />;
}

/** One line of fake text; widths vary so lists don't look like a barcode. */
export function SkeletonLine({
  width = "w-full",
  className,
}: {
  width?: string;
  className?: string;
}) {
  return <SkeletonBlock className={cn("h-3", width, className)} />;
}

/** Matches ResourceCard's height so the grid does not jump on load. */
export function ResourceCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-4" aria-hidden>
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-4 w-16" rounded="rounded-full" />
            <SkeletonBlock className="h-4 w-12" rounded="rounded-full" />
          </div>
          <SkeletonLine width="w-4/5" className="h-4" />
          <SkeletonLine width="w-2/3" />
          <div className="flex items-center gap-3 pt-1">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        </div>
        <SkeletonBlock className="h-14 w-14 shrink-0" rounded="rounded-full" />
      </div>
    </div>
  );
}

/** Vertical list of card skeletons — used by category and search screens. */
export function ResourceListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <ResourceCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** The 2-column category grid on the home screen. */
export function CategoryGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="glass rounded-2xl p-4" aria-hidden>
          <div className="space-y-3">
            <SkeletonBlock className="h-9 w-9" rounded="rounded-xl" />
            <SkeletonLine width="w-3/4" />
            <SkeletonLine width="w-1/2" />
            <SkeletonBlock className="h-2 w-full" rounded="rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Horizontal rail of cards ("Updated today"). */
export function RailSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-hidden px-5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="glass w-[248px] shrink-0 space-y-3 rounded-2xl p-4"
          aria-hidden
        >
          <SkeletonBlock className="h-4 w-14" rounded="rounded-full" />
          <SkeletonLine width="w-5/6" className="h-4" />
          <SkeletonLine width="w-2/3" />
          <div className="flex items-center justify-between pt-1">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-10 w-10" rounded="rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Quiz question card placeholder. */
export function QuizSkeleton() {
  return (
    <div className="glass space-y-4 rounded-2xl p-5" aria-hidden>
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-4 w-24" rounded="rounded-full" />
        <SkeletonBlock className="h-4 w-12" rounded="rounded-full" />
      </div>
      <SkeletonLine width="w-full" className="h-4" />
      <SkeletonLine width="w-4/5" className="h-4" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-12 w-full" rounded="rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Header row: avatar + name + stat pills. */
export function GreetingSkeleton() {
  return (
    <div className="flex items-center justify-between" aria-hidden>
      <div className="space-y-3">
        <SkeletonLine width="w-24" />
        <SkeletonBlock className="h-6 w-40" />
      </div>
      <SkeletonBlock className="h-12 w-12" rounded="rounded-full" />
    </div>
  );
}

/** Used by app/loading.tsx and by any full-screen fetch. */
export function ScreenSkeleton() {
  return (
    <div className="space-y-6 px-5 pt-safe">
      <GreetingSkeleton />
      <SkeletonBlock className="h-28 w-full" rounded="rounded-2xl" />
      <RailSkeleton />
      <CategoryGridSkeleton />
    </div>
  );
}
