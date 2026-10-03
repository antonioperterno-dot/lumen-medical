import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaperPlayer from "@/components/PaperPlayer";
import { getPaper } from "@/lib/papers";

export const runtime = "nodejs";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const paper = await getPaper(params.id);
  return { title: paper ? `${paper.title} - LUMEN` : "Paper - LUMEN" };
}

export default async function PaperPage({ params }: { params: { id: string } }) {
  const paper = await getPaper(params.id);
  if (!paper) notFound();
  return <PaperPlayer paper={paper} />;
}
