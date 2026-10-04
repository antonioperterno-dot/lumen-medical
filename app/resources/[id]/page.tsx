import type { Metadata } from "next";
import ResourceReader from "@/components/ResourceReader";

/**
 * /resources/[id]
 * The param is all the router needs; the reader itself is a client component so
 * it can track scroll progress and read from the offline mirror.
 */
export const metadata: Metadata = {
  title: "Resource | LUMEN",
  description: "Offline-first medical study resource.",
};

export default async function ResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResourceReader id={id} />;
}
