import type { Metadata } from "next";
import CategoryScreen from "@/components/CategoryScreen";

/**
 * /categories/[slug]
 * The server component only resolves the route param; the interactive list is
 * a client component so it can use the offline mirror and the progress rings.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, " ");
  return {
    title: `${name.charAt(0).toUpperCase()}${name.slice(1)} | LUMEN`,
    description: `Study resources for ${name}, offline-first.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CategoryScreen slug={slug} />;
}
