import type { Metadata } from "next";
import Link from "next/link";
import ScreenHeader from "@/components/ScreenHeader";
import { getPapers } from "@/lib/papers";

const UNITS: Record<string, string> = {
  pharmacology: "Pharmacology",
  psychology: "Psychology",
  physiology: "Physiology",
  anatomy: "Anatomy",
  "first-aid": "First Aid",
  nursing: "Nursing",
  microbiology: "Microbiology",
  "medical-journals": "Medical Journals",
};

export async function generateMetadata({ params }: { params: { unit: string } }): Promise<Metadata> {
  const name = UNITS[params.unit] ?? params.unit.replace(/-/g, " ");
  return { title: `${name} Quizzes | LUMEN`, description: `Course quizzes for ${name}, grouped by level.` };
}

export default async function CourseUnitQuizzesPage({ params }: { params: { unit: string } }) {
  const name = UNITS[params.unit];
  if (!name) return <main className="px-5"><ScreenHeader title="Course unit not found" back="/papers" /></main>;

  const papers = await getPapers(params.unit);
  const byLevel = new Map<number, typeof papers>();
  for (const paper of papers) {
    const group = byLevel.get(paper.level) ?? [];
    group.push(paper);
    byLevel.set(paper.level, group);
  }

  const levels = [...byLevel.entries()]
    .map(([level, levelPapers]) => [
      level,
      levelPapers.sort((a, b) =>
        Date.parse(b.publishAt) - Date.parse(a.publishAt) || b.id.localeCompare(a.id),
      ),
    ] as const)
    .sort((a, b) =>
      Date.parse(b[1][0]?.publishAt ?? "") - Date.parse(a[1][0]?.publishAt ?? "") || b[0] - a[0],
    );

  return (
    <main className="space-y-5 px-5">
      <ScreenHeader title={`${name} quizzes`} subtitle="Newest first · quiz numbers restart at each level" back="/papers" />
      {levels.length === 0 ? (
        <section className="glass rounded-2xl p-5">
          <h2 className="text-[15px] font-semibold text-white">No quizzes published yet</h2>
          <p className="mt-1 text-[12px] text-dim">Published quizzes for {name} will appear here.</p>
        </section>
      ) : (
        levels.map(([level, levelPapers]) => (
          <section key={level} className="space-y-3">
            <div className="flex items-end justify-between">
              <h2 className="text-[16px] font-semibold text-white">Level {level}</h2>
              <span className="text-[11px] text-faint">{levelPapers.length} {levelPapers.length === 1 ? "quiz" : "quizzes"}</span>
            </div>
            <div className="space-y-2">
              {levelPapers.map((paper, index) => (
                <Link key={paper.id} href={`/papers/${paper.id}`} className="glass glass-pressable flex items-center gap-3 rounded-2xl p-4">
                  <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-xl border border-lumen/30 bg-lumen/10 text-[13px] font-bold text-lumen">
                    Q{index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-white">{paper.title}</span>
                    <span className="text-[11px] text-faint">{paper.durationMinutes} min · {new Date(paper.publishAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Nairobi" })}</span>
                  </span>
                  <span className="shrink-0 text-[11px] font-semibold text-lumen">Open</span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
