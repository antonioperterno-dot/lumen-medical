import { ScreenSkeleton } from "@/components/Skeleton";

/**
 * Route-level loading UI.
 * Next.js shows this the instant a navigation starts, which keeps LUMEN feeling
 * native even when the destination needs a network round trip.
 */
export default function Loading() {
  return <ScreenSkeleton />;
}
