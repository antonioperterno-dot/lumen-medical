import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaperPlayer from "@/components/PaperPlayer";
import { getPaper } from "@/lib/papers";

export const runtime = "nodejs";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const paper = await getPaper(id);
  return { title: paper ? `${paper.title} - LUMEN` : "Paper - LUMEN" };
}

export default async function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paper = await getPaper(id);
  if (!paper) notFound();
  return <PaperPlayer paper={paper} />;
}
