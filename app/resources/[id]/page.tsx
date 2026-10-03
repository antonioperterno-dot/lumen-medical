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

export default function ResourcePage({ params }: { params: { id: string } }) {
  return <ResourceReader id={params.id} />;
}
