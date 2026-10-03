import type { Metadata } from "next";
import CategoryScreen from "@/components/CategoryScreen";

/**
 * /categories/[slug]
 * The server component only resolves the route param; the interactive list is
 * a client component so it can use the offline mirror and the progress rings.
 */
export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const name = params.slug.replace(/-/g, " ");
  return {
    title: `${name.charAt(0).toUpperCase()}${name.slice(1)} | LUMEN`,
    description: `Study resources for ${name}, offline-first.`,
  };
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  return <CategoryScreen slug={params.slug} />;
}
